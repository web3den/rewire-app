/**
 * DELIBERATE FAILURE TEST
 * 
 * This test exists to validate ForgeBeyond CI analysis integration.
 * Push this to a feature branch → trigger workflow → verify ForgeBeyond catches it.
 * 
 * DELETE THIS FILE after validating the integration works.
 */

describe('Deliberate failure for ForgeBeyond validation', () => {
  test('this test should fail (remove after validation)', () => {
    const result = 2 + 2;
    expect(result).toBe(5); // Intentionally wrong
  });

  test('this test passes (control)', () => {
    expect(true).toBe(true);
  });
});
