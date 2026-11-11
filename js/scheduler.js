/** Coalesce invalidations in one frame; callers can await the completed render. */
export function createRenderScheduler(render, frame = requestAnimationFrame) {
  let queued;
  return function requestRender({animate = false, type} = {}) {
    if (!queued) {
      let resolve, reject;
      const promise = new Promise((done, fail) => {resolve = done;reject = fail;});
      queued = {options:{animate:false}, promise, resolve, reject};
      frame(() => {
        const task = queued;
        queued = null;
        try {Promise.resolve(render(task.options)).then(task.resolve, task.reject);}
        catch (error) {task.reject(error);}
      });
    }
    queued.options.animate ||= animate;
    if (type) queued.options.type = type;
    return queued.promise;
  };
}
