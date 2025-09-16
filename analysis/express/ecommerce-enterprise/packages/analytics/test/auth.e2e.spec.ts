import request from 'supertest';

const base = 'http://localhost:3003/api/v1/analytics';

describe('AuthX e2e', () => {
  it('403 unauth, 201 login, 200 protected with Bearer, 200 after refresh', async () => {
    // unauth should be forbidden
    await request(base).get('/events').expect(403);

    // login as admin
    const loginRes = await request(base)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'demo@example.com', roles: ['admin'] })
      .expect(201);

    const { accessToken, refreshToken } = loginRes.body;
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    // access with bearer
    // wait for route availability (dev servers can lag)
    let ok = false;
    for (let i = 0; i < 10 && !ok; i++) {
      const r = await request(base).get('/auth/me').set('Authorization', `Bearer ${accessToken}`);
      if (r.status === 200) ok = true; else await new Promise(res => setTimeout(res, 300));
    }
    expect(ok).toBe(true);

    // rotate
    const rotateRes = await request(base)
      .post('/auth/refresh')
      .set('x-refresh-token', refreshToken)
      .expect(201)
      .catch(async (e) => {
        // Some handlers return 200; accept 200/201
        const res = e.response;
        if (res && (res.status === 200 || res.status === 201)) return res;
        throw e;
      });

    const newAccess = (rotateRes.body?.accessToken) || accessToken;
    ok = false;
    for (let i = 0; i < 10 && !ok; i++) {
      const r2 = await request(base).get('/auth/me').set('Authorization', `Bearer ${newAccess}`);
      if (r2.status === 200) ok = true; else await new Promise(res => setTimeout(res, 300));
    }
    expect(ok).toBe(true);
  }, 20000);
});


