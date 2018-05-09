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
    this.resolve = this.reject = this.resolveArg = this.rejectArg = void 0;
    this.nextResolve = this.nextReject = this.nextResolveArg = void 0;
    try {
      executor(
        arg => {
          setTimeout(() => {
            this.status = PROMISE_STATUS.FULFILLED;
            this.resolveArg = arg;
            this.callResolve();
            this.callNextResolve();
          });
        },
        arg => {
          setTimeout(() => {
            this.status = PROMISE_STATUS.REJECTED;
            this.rejectArg = arg;
            this.callReject();
            this.callNextResolve();
          });
        }
      );
    } catch (err) {
      this.status = PROMISE_STATUS.REJECTED;
      this.rejectArg = err;
      this.callReject();
      this.callNextReject();
    }
  }

  callResolve() {
    if (!isFn(this.resolve)) {
      return;
    }
    this.nextResolveArg = this.resolve.call(null, this.resolveArg);
  }

  callReject() {
    if (!isFn(this.reject)) {
      return;
    }
    this.nextResolveArg = this.reject.call(null, this.rejectArg);
  }

  callNextResolve() {
    if (!isFn(this.nextResolve)) {
      return;
    }
    if (this.nextResolveArg instanceof P) {
      this.nextResolveArg.then(this.nextResolve, this.nextReject);
    } else {
      this.nextResolve(this.nextResolveArg);
    }
  }

  callNextReject() {
    if (!isFn(this.nextReject)) {
      return;
    }
    this.nextReject(this.nextRejectArg);
  }

  then(resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;
    const p = new P((resolve, reject) => {
      this.nextResolve = resolve;
      this.nextReject = reject;
    });
    if (this.status === PROMISE_STATUS.FULFILLED) {
      this.callResolve();
      this.callNextResolve();
    }
    if (this.status === PROMISE_STATUS.REJECTED) {
      this.callReject();
      this.callNextResolve();
    }
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
