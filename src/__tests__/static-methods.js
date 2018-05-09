const P = require('../promise');

describe('static methods', () => {
  test('resolve', done => {
    const p = P.resolve('hello');
    expect(p instanceof P).toBeTruthy();
    expect(p.status).toBe(P.STATUS.PENDING);
    p.then(s => {
      expect(p.status).toBe(P.STATUS.FULFILLED);
      expect(s).toBe('hello');
      done();
    });
  });

  test('reject', done => {
    const p = P.reject('ops');
    expect(p instanceof P).toBeTruthy();
    expect(p.status).toBe(P.STATUS.PENDING);
    p.catch(s => {
      expect(p.status).toBe(P.STATUS.REJECTED);
      expect(s).toBe('ops');
      done();
    });
  });

  describe('all', () => {
    const a = P.resolve('a');
    const b = 'b';
    const c = 1;
    const d = P.reject('d');

    test('resolve', done => {
      P.all([a, b, c]).then(([a, b, c]) => {
        expect(a).toBe('a');
        expect(b).toBe('b');
        expect(c).toBe(1);
        done();
      });
    });

    test('reject', done => {
      P.all([a, b, d]).catch(err => {
        expect(err).toBe('d');
        done();
      });
    });
  });

  describe('race', () => {
    test('base', done => {
      const a = new P(resolve => {
        setTimeout(() => resolve('a'), 100);
      });
      const b = new P(resolve => {
        setTimeout(() => resolve('b'), 200);
      });
      P.race([a, b]).then(win => {
        expect(win).toBe('a');
        done();
      });
    });

    test('promise and string', done => {
      const a = P.resolve('a');
      const b = new P(resolve => {
        setTimeout(() => resolve('a'), 100);
      });
      P.race([a, b]).then(win => {
        expect(win).toBe('a');
        done();
      });
    });

    test('reject: reject before resolve', done => {
      const a = new P(resolve => {
        setTimeout(() => resolve('a'), 100);
      });
      const b = new P((resolve, reject) => {
        setTimeout(() => reject('b'), 50);
      });
      P.race([a, b]).catch(err => {
        expect(err).toBe('b');
        done();
      });
    });

    test('reject: reject after resolve', done => {
      const a = new P(resolve => {
        setTimeout(() => resolve('a'), 50);
      });
      const b = new P((resolve, reject) => {
        setTimeout(() => reject('b'), 100);
      });
      P.race([a, b]).then(win => {
        expect(win).toBe('a');
        done();
      });
    });
  });
});
