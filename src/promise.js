const PROMISE_STATUS = {
  PENDING: Symbol('pending'),
  FULFILLED: Symbol('fulfilled'),
  REJECTED: Symbol('rejected')
};

function isFn(fn) {
  return typeof fn === 'function';
}

class P {
  constructor(executor) {
    this.status = PROMISE_STATUS.PENDING;
    try {
      executor(this.execResolve.bind(this), this.execReject.bind(this));
    } catch (err) {
      this.status = PROMISE_STATUS.REJECTED;
      this.setArg(err);
      this.next();
    }
  }

  execResolve(arg) {
    setTimeout(() => {
      this.status = PROMISE_STATUS.FULFILLED;
      this.setArg(arg);
      this.next();
    });
  }

  execReject(arg) {
    setTimeout(() => {
      this.status = PROMISE_STATUS.REJECTED;
      this.setArg(arg);
      this.next();
    });
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

  next() {
    if (!this.handlersSetted || this.status === PROMISE_STATUS.PENDING) {
      return;
    }
    const {onFullfiled, nextFullfiled, onRejected, nextRejected} = this;
    function resolveMaybePromise(p, resolve, reject) {
      if (p instanceof P) {
        p.then(resolve, reject);
      } else {
        resolve(p);
      }
    }
    if (this.status === PROMISE_STATUS.FULFILLED) {
      resolveMaybePromise(
        isFn(onFullfiled) ? onFullfiled(this.arg) : this.arg,
        nextFullfiled,
        nextRejected
      );
    }
    if (this.status === PROMISE_STATUS.REJECTED) {
      if (isFn(onRejected)) {
        resolveMaybePromise(onRejected(this.arg), nextFullfiled, nextRejected);
      } else {
        resolveMaybePromise(this.arg, nextRejected, null);
      }
    }
  }

  then(onFullfiled, onRejected) {
    const p = new P((resolve, reject) => {
      this.setHandlers(onFullfiled, resolve, onRejected, reject);
    });
    this.next();
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
