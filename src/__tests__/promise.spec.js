const P = require('../promise');

describe('promise', () => {
  test(
    'resolve',
    done => {
      const p = new P((resolve, reject) => {
        setTimeout(() => {
          resolve(1);
        }, 10);
      });
      expect(p.status).toBe(P.STATUS.PENDING);
      p.then(n => {
        expect(p.status).toBe(P.STATUS.FULFILLED);
        expect(n).toBe(1);
        done();
      });
    },
    100
  );

  test('resolve sync', done => {
    const p = new P(resolve => {
      resolve(1);
    });
    expect(p.status).toBe(P.STATUS.PENDING);
    p.then(n => {
      expect(p.status).toBe(P.STATUS.FULFILLED);
      expect(n).toBe(1);
      done();
    });
  });

  test(
    'reject',
    done => {
      const p = new P((resolve, reject) => {
        setTimeout(() => {
          reject(1);
        }, 10);
      });
      expect(p.status).toBe(P.STATUS.PENDING);
      p.then(null, n => {
        expect(p.status).toBe(P.STATUS.REJECTED);
        expect(n).toBe(1);
        done();
      });
    },
    100
  );

  test('reject sync', done => {
    const p = new P((resolve, reject) => {
      reject(1);
    });
    expect(p.status).toBe(P.STATUS.PENDING);
    p.then(null, n => {
      expect(p.status).toBe(P.STATUS.REJECTED);
      expect(n).toBe(1);
      done();
    });
  });

  test('catch alias', done => {
    const p = new P((resolve, reject) => {
      reject(1);
    });
    expect(p.status).toBe(P.STATUS.PENDING);
    p.catch(n => {
      expect(p.status).toBe(P.STATUS.REJECTED);
      expect(n).toBe(1);
      done();
    });
  });

  test(
    'thenable',
    done => {
      const p = new P((resolve, reject) => {
        setTimeout(() => {
          resolve(1);
        }, 10);
      });
      const p1 = p.then(n => {
        expect(n).toBe(1);
        return 2;
      });
      expect(p1.status).toBe(P.STATUS.PENDING);
      const p2 = p1.then(n => {
        expect(p1.status).toBe(P.STATUS.FULFILLED);
        expect(n).toBe(2);
        return 3;
      });
      expect(p2.status).toBe(P.STATUS.PENDING);
      const p3 = p2.then(n => {
        expect(p2.status).toBe(P.STATUS.FULFILLED);
        expect(n).toBe(3);
        done();
      });
      expect(p3.status).toBe(P.STATUS.PENDING);
    },
    100
  );

  test(
    'thenable after aync',
    done => {
      const p = new P(resolve => {
        resolve(1);
      });
      const p1 = p.then(n => {
        expect(n).toBe(1);
        return 2;
      });
      expect(p1.status).toBe(P.STATUS.PENDING);
      p1.then(n => {
        expect(p1.status).toBe(P.STATUS.FULFILLED);
        expect(n).toBe(2);
        done();
      });
    },
    100
  );

  test(
    'thenable after catch',
    done => {
      const p = new P((resolve, reject) => {
        reject(new Error('err'));
      });
      expect(p.status).toBe(P.STATUS.PENDING);
      const p2 = p.catch(err => {
        expect(err.message).toBe('err');
        return 1;
      });
      expect(p2.status).toBe(P.STATUS.PENDING);
      p2.then(n => {
        expect(p2.status).toBe(P.STATUS.FULFILLED);
        expect(n).toBe(1);
        done();
      });
    },
    100
  );

  test('uncaught error in callback', done => {
    const p = new P(() => {
      throw new Error('mew');
    });
    p.catch(err => {
      expect(err.message).toBe('mew');
      done();
    });
  });

  test('pass through uncaught error', done => {
    const p = new P(() => {
      throw new Error('mew');
    });
    p.then(() => {}).catch(err => {
      expect(err.message).toBe('mew');
      done();
    });
  });

  describe('return promise in handler', () => {
    const a = P.resolve(1);

    test('fulfilled promise', done => {
      const b = P.resolve(2);
      a.then(() => b).then(n => {
        expect(n).toBe(2);
        done();
      });
    });

    test(
      'rejected promise',
      done => {
        const b = P.reject(2);
        a.then(() => b).catch(n => {
          expect(n).toBe(2);
          done();
        });
      },
      100
    );
  });
});
