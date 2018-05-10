const PROMISE_STATUS = {
  PENDING: Symbol('pending'),
  FULFILLED: Symbol('fulfilled'),
  REJECTED: Symbol('rejected')
};

function isFn(fn) {
  return typeof fn === 'function';
}

class Handler {
  constructor(p) {
    this.promise = p;
    this.arg = undefined;
    this.handlersSetted = false;
  }

  get status() {
    return this.promise.status;
  }

  setArg(arg) {
    this.arg = arg;
  }

  setHandlers(onFullfiled, nextFullfiled, onRejected, nextRejected) {
    this.handlersSetted = true;
    this.onFullfiled = onFullfiled;
    this.nextFullfiled = nextFullfiled;
    this.onRejected = onRejected;
    this.nextRejected = nextRejected;
  }

  unwind() {
    if (!this.handlersSetted || this.arg === undefined) {
      return;
    }
    let {onFullfiled, nextFullfiled, onRejected, nextRejected} = this;
    function next(p) {
      if (p instanceof P) {
        p.then(nextFullfiled, nextRejected);
      } else {
        nextFullfiled(p);
      }
    }
    if (this.status === PROMISE_STATUS.FULFILLED) {
      if (isFn(onFullfiled)) {
        next(onFullfiled(this.arg));
      } else {
        next();
      }
    }
    if (this.status === PROMISE_STATUS.REJECTED) {
      if (isFn(onRejected)) {
        next(onRejected(this.arg));
      } else {
        nextRejected(this.arg);
      }
    }
  }
}

class P {
  constructor(executor) {
    this.status = PROMISE_STATUS.PENDING;
    this.h = new Handler(this);
    this.execResolve = arg => {
      setTimeout(() => {
        this.status = PROMISE_STATUS.FULFILLED;
        this.h.setArg(arg);
        this.h.unwind();
      });
    };
    this.execReject = arg => {
      setTimeout(() => {
        this.status = PROMISE_STATUS.REJECTED;
        this.h.setArg(arg);
        this.h.unwind();
      });
    };
    try {
      executor(this.execResolve, this.execReject);
    } catch (err) {
      this.status = PROMISE_STATUS.REJECTED;
      this.h.setArg(err);
      this.h.unwind();
    }
  }

  then(onFullfiled, onRejected) {
    const p = new P((resolve, reject) => {
      this.h.setHandlers(onFullfiled, resolve, onRejected, reject);
    });
    this.h.unwind();
    return p;
  }

  catch(reject) {
    return this.then(null, reject);
  }
}

P.STATUS = PROMISE_STATUS;

P.resolve = function(value) {
  return new P(resolve => resolve(value));
};

P.reject = function(reason) {
  return new P((resolve, reject) => reject(reason));
};

function promisifyIterable(iterable) {
  return iterable.map(p => {
    if (p instanceof P) {
      return p;
    }
    if (typeof p === 'string' || typeof p === 'number') {
      return P.resolve(p);
    } else {
      return P.resolve();
    }
  });
}

P.all = function(iterable) {
  return new P((resolve, reject) => {
    const ret = Array(iterable.length);
    let resolved = 0;
    let rejected = false;
    promisifyIterable(iterable).forEach((p, index) => {
      p.then(
        a => {
          ret[index] = a;
          if (++resolved === ret.length) {
            resolve(ret);
          }
        },
        b => {
          if (!rejected) {
            rejected = true;
            reject(b);
          }
        }
      );
    });
  });
};

P.race = function(iterable) {
  return new P((resolve, reject) => {
    const ret = Array(iterable.length);
    let resolved = false;
    let rejected = false;
    promisifyIterable(iterable).forEach((p, index) => {
      p.then(
        a => {
          if (!resolved && !rejected) {
            resolved = true;
            resolve(a);
          }
        },
        b => {
          if (!resolved && !rejected) {
            rejected = true;
            reject(b);
          }
        }
      );
    });
  });
};

module.exports = P;
