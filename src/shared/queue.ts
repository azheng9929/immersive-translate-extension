type PendingTask<T> = {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

export class TranslationQueue {
  private active = 0;
  private pending: PendingTask<unknown>[] = [];

  constructor(private readonly maxConcurrent: number) {}

  enqueue<T>(run: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: PendingTask<T> = { run, resolve, reject };
      if (this.active < this.maxConcurrent) {
        this.start(task);
      } else {
        this.pending.push(task as PendingTask<unknown>);
      }
    });
  }

  clearPending(): void {
    const pending = this.pending.splice(0);
    for (const task of pending) {
      task.reject(new Error("Translation task cancelled before start"));
    }
  }

  getStatus(): { active: number; pending: number; maxConcurrent: number } {
    return {
      active: this.active,
      pending: this.pending.length,
      maxConcurrent: this.maxConcurrent,
    };
  }

  private start<T>(task: PendingTask<T>): void {
    this.active += 1;
    task
      .run()
      .then(task.resolve, task.reject)
      .finally(() => {
        this.active -= 1;
        this.processNext();
      });
  }

  private processNext(): void {
    const next = this.pending.shift();
    if (!next) return;
    this.start(next);
  }
}
