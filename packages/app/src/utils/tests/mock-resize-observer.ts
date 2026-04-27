export const mockResizeObserver = () => {
  class MockResizeObserver {
    callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe = jest.fn((target: Element) => {
      // Immediately trigger with a fake entry
      this.callback(
        [
          {
            target,
            contentRect: target.getBoundingClientRect(),
          } as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver
      );
    });

    unobserve = jest.fn();
    disconnect = jest.fn();
  }

  global.ResizeObserver = MockResizeObserver;
};
