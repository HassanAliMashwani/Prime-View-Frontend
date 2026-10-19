/**
 * Prime View Request Lanes Coordinator
 * 
 * Two-lane request execution system:
 * 
 * Lane 1 (User-interactive / Foreground):
 * - User is waiting to see or save: search, filter, page change, opening a block or a record,
 *   and any save (book, verify, reject, strike, password, content save).
 * - Starts immediately.
 * - Button or control shows busy as soon as pressed.
 * - Draw the result only from the server answer.
 * - Cancels only an older request for that same screen whose answer would be discarded.
 * - NEVER cancels a save.
 * - If a Lane 2 request in flight is the exact page or block the user just opened, keep it and show its answer.
 * 
 * Lane 2 (Background only):
 * - The next list page, the other dashboard chart ranges, the master-plan block loop, and the 30-second refresh.
 * - Starts ONLY while Lane 1 is idle.
 * - If Lane 1 starts while Lane 2 is running, remaining Lane 2 tasks pause until Lane 1 returns.
 * - After Lane 1 returns, continue Lane 2 from where it stopped.
 * - A 30-second refresh must not discard the answer to a request the user is still waiting on.
 * - Visible rows, cards, and map stay on screen.
 * - Hover, scroll, and opening a menu do not start or cancel requests.
 * - Never prefetch receipt photos, documents, or plot drawers.
 */

export interface Lane1Options<T> {
  screen?: string;
  key?: string;
  isSave?: boolean;
  fn: (signal?: AbortSignal) => Promise<T>;
}

export interface Lane2Options<T> {
  key?: string;
  screen?: string;
  isRefresh?: boolean;
  fn: (signal?: AbortSignal) => Promise<T>;
}

interface InFlightScreen {
  abortController: AbortController;
  isSave: boolean;
  seq: number;
  isDiscarded: boolean;
}

interface InFlightLane2 {
  key: string;
  promise: Promise<any>;
  isPromoted: boolean;
  result?: any;
  error?: any;
}

interface QueuedLane2Task {
  id: number;
  key?: string;
  screen?: string;
  isRefresh?: boolean;
  fn: (signal?: AbortSignal) => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

class RequestLanesCoordinator {
  private lane1ActiveCount = 0;
  private activeSaves = new Set<string>();
  private screenInFlight = new Map<string, InFlightScreen>();
  private screenSequences = new Map<string, number>();
  private lane2InFlight = new Map<string, InFlightLane2>();
  private lane2InFlightByScreen = new Map<string, AbortController>();
  private lane2Queue: QueuedLane2Task[] = [];
  private isProcessingLane2 = false;
  private nextTaskId = 1;
  private listeners = new Set<(isBusy: boolean) => void>();

  /**
   * Check if Lane 1 is currently idle (no user-facing interactive requests running).
   */
  public isLane1Idle(): boolean {
    return this.lane1ActiveCount === 0;
  }

  /**
   * Check if a specific screen has an active Lane 1 request in flight.
   */
  public isScreenLane1Busy(screen: string): boolean {
    for (const [key, active] of this.screenInFlight.entries()) {
      if ((key === screen || key.startsWith(`${screen}:`)) && !active.isDiscarded) {
        return true;
      }
    }
    return false;
  }

  /**
   * Subscribe to Lane 1 busy state changes.
   */
  public subscribeLane1(listener: (isBusy: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const isBusy = this.lane1ActiveCount > 0;
    for (const listener of this.listeners) {
      try {
        listener(isBusy);
      } catch { /* ignore */ }
    }
  }

  /**
   * Get and increment sequence number for a screen to detect stale background updates.
   */
  public nextScreenSequence(screen: string): number {
    const current = (this.screenSequences.get(screen) || 0) + 1;
    this.screenSequences.set(screen, current);
    return current;
  }

  public getScreenSequence(screen: string): number {
    return this.screenSequences.get(screen) || 0;
  }

  /**
   * Register a background promise in Lane 2 so Lane 1 can promote it if opened.
   */
  public registerLane2InFlight(key: string, promise: Promise<any>) {
    if (!this.lane2InFlight.has(key)) {
      this.lane2InFlight.set(key, {
        key,
        promise,
        isPromoted: false,
      });
      promise
        .finally(() => {
          this.lane2InFlight.delete(key);
        })
        .catch(() => {});
    }
  }

  /**
   * Lane 1: User is waiting to see or save.
   * - Starts immediately.
   * - Reads that belong to the same page run together (concurrently).
   * - Cancels only an older read request for that exact same stream/key whose answer would be discarded.
   * - A save still runs alone so a double click cannot book or pay twice.
   */
  public async runLane1<T>(options: Lane1Options<T>): Promise<T> {
    const { screen, key, isSave = false, fn } = options;

    const saveKey = screen || 'global_save';
    if (isSave) {
      if (this.activeSaves.has(saveKey)) {
        throw new Error('SAVE_IN_PROGRESS');
      }
      this.activeSaves.add(saveKey);
    }

    // Determine the stream key for tracking replacement.
    // If a key is provided, only abort older queries for that exact stream on this screen.
    // If no key is provided, generate a unique stream key so independent reads on the same screen run together in parallel without aborting each other!
    let streamKey: string | undefined;
    let currentSeq = 0;
    const abortController = new AbortController();

    if (screen) {
      if (key) {
        streamKey = `${screen}:${key}`;
        currentSeq = this.nextScreenSequence(streamKey);
        const existing = this.screenInFlight.get(streamKey);
        if (existing && !existing.isSave) {
          existing.isDiscarded = true;
          try {
            existing.abortController.abort();
          } catch { /* ignore */ }
        }
        // Also abort any running Lane 2 background refresh for this same stream
        const bgRefresh = this.lane2InFlightByScreen.get(streamKey);
        if (bgRefresh) {
          try {
            bgRefresh.abort();
          } catch { /* ignore */ }
          this.lane2InFlightByScreen.delete(streamKey);
        }
      } else {
        currentSeq = this.nextScreenSequence(screen);
        streamKey = `${screen}:__req_${currentSeq}`;
      }
    }

    const tracker: InFlightScreen = {
      abortController,
      isSave,
      seq: currentSeq,
      isDiscarded: false,
    };

    if (streamKey) {
      this.screenInFlight.set(streamKey, tracker);
    }

    this.lane1ActiveCount++;
    this.notifyListeners();

    try {
      let result: T;

      // Check if a Lane 2 request in flight is the EXACT resource/page/block user just opened
      if (key && this.lane2InFlight.has(key)) {
        const inFlight = this.lane2InFlight.get(key)!;
        inFlight.isPromoted = true;

        let reusedData: any;
        try {
          reusedData = await inFlight.promise;
        } catch {
          reusedData = undefined;
        }

        if (reusedData !== undefined && reusedData !== null) {
          result = reusedData as T;
        } else {
          result = await fn(abortController.signal);
        }
      } else {
        // If key is queued in Lane 2 waiting for Lane 1 to finish, dequeue it and execute immediately
        if (key) {
          const qIndex = this.lane2Queue.findIndex((t) => t.key === key);
          if (qIndex !== -1) {
            const [qTask] = this.lane2Queue.splice(qIndex, 1);
            result = await fn(abortController.signal);
            qTask.resolve(result);
            if (tracker.isDiscarded && !isSave) {
              throw new Error('REQUEST_SUPERSEDED');
            }
            return result;
          }
        }

        result = await fn(abortController.signal);
      }

      // If an older read request for this exact stream was discarded by a newer query, throw
      if (tracker.isDiscarded && !isSave) {
        throw new Error('REQUEST_SUPERSEDED');
      }

      return result;
    } finally {
      if (isSave) {
        this.activeSaves.delete(saveKey);
      }
      if (streamKey && this.screenInFlight.get(streamKey) === tracker) {
        this.screenInFlight.delete(streamKey);
      }

      this.lane1ActiveCount--;
      this.notifyListeners();

      // If Lane 1 is now idle, continue Lane 2 from where it stopped
      if (this.isLane1Idle()) {
        this.processLane2Queue();
      }
    }
  }

  /**
   * Lane 2: Background tasks only (prefetch, master-plan block loop, 30s refresh).
   * - Starts only while Lane 1 is idle.
   * - A 30-second refresh must not discard the answer to a request the user is still waiting on.
   */
  public runLane2<T>(options: Lane2Options<T>): Promise<T> {
    const { key, screen, isRefresh = false, fn } = options;

    return new Promise<T>((resolve, reject) => {
      const task: QueuedLane2Task = {
        id: this.nextTaskId++,
        key,
        screen,
        isRefresh,
        fn,
        resolve,
        reject,
      };

      // If Lane 1 is busy, enqueue task and wait
      if (!this.isLane1Idle()) {
        this.lane2Queue.push(task);
        return;
      }

      // If Lane 1 is idle, queue and immediately process
      this.lane2Queue.push(task);
      this.processLane2Queue();
    });
  }

  /**
   * Fire-and-forget helper for Lane 2 background tasks.
   */
  public enqueueLane2(fn: (signal?: AbortSignal) => Promise<any>, key?: string, screen?: string) {
    this.runLane2({ fn, key, screen }).catch(() => {});
  }

  /**
   * Process Lane 2 queue items concurrently in batches of up to 4 parallel tasks
   * while Lane 1 is idle, eliminating single-file queue bottlenecks.
   */
  private async processLane2Queue() {
    if (this.isProcessingLane2) return;
    this.isProcessingLane2 = true;

    try {
      while (this.lane2Queue.length > 0 && this.isLane1Idle()) {
        const batchSize = Math.min(this.lane2Queue.length, 4);
        const tasks = this.lane2Queue.splice(0, batchSize);

        await Promise.all(
          tasks.map(async (task) => {
            const { key, screen, isRefresh, fn, resolve, reject } = task;

            // Check if key is already in flight in Lane 2
            if (key && this.lane2InFlight.has(key)) {
              try {
                const res = await this.lane2InFlight.get(key)!.promise;
                resolve(res);
              } catch (err) {
                reject(err);
              }
              return;
            }

            const streamKey = screen ? (key ? `${screen}:${key}` : screen) : undefined;
            const startSeq = streamKey ? this.getScreenSequence(streamKey) : 0;
            const abortController = new AbortController();

            if (streamKey && isRefresh) {
              this.lane2InFlightByScreen.set(streamKey, abortController);
            }

            const promise = (async () => {
              return await fn(abortController.signal);
            })();

            if (key) {
              this.lane2InFlight.set(key, {
                key,
                promise,
                isPromoted: false,
              });
            }

            try {
              const result = await promise;

              // For 30s refresh: if screen sequence advanced while refresh ran,
              // OR if Lane 1 is currently busy on this stream, OR if aborted: discard refresh!
              if (isRefresh && streamKey) {
                const currentSeq = this.getScreenSequence(streamKey);
                if (currentSeq > startSeq || this.isScreenLane1Busy(streamKey) || abortController.signal.aborted) {
                  resolve(undefined);
                  return;
                }
              }

              resolve(result);
            } catch (err) {
              reject(err);
            } finally {
              if (streamKey && isRefresh && this.lane2InFlightByScreen.get(streamKey) === abortController) {
                this.lane2InFlightByScreen.delete(streamKey);
              }
              if (key) {
                this.lane2InFlight.delete(key);
              }
            }
          })
        );
      }
    } finally {
      this.isProcessingLane2 = false;
    }
  }
}

// Global singleton instance
export const requestLanes = new RequestLanesCoordinator();

/**
 * Convenient helper functions for exports
 */
export function runLane1<T>(options: Lane1Options<T>): Promise<T> {
  return requestLanes.runLane1(options);
}

export function runLane2<T>(options: Lane2Options<T>): Promise<T> {
  return requestLanes.runLane2(options);
}

export function enqueueLane2(fn: (signal?: AbortSignal) => Promise<any>, key?: string, screen?: string): void {
  requestLanes.enqueueLane2(fn, key, screen);
}

export function isLane1Idle(): boolean {
  return requestLanes.isLane1Idle();
}

export function isScreenLane1Busy(screen: string): boolean {
  return requestLanes.isScreenLane1Busy(screen);
}
