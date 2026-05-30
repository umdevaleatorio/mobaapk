import { sharedDateState, updateSharedDate } from '../../../utils/salesDateSharedState';

describe('salesDateSharedState Utility', () => {
  it('should maintain initial default state values', () => {
    expect(sharedDateState.isRange).toBe(false);
    expect(sharedDateState.hasFiltered).toBe(true);
    expect(sharedDateState.startDate).toBeInstanceOf(Date);
    expect(sharedDateState.endDate).toBeInstanceOf(Date);
  });

  it('should update state attributes correctly', () => {
    const newStart = new Date('2026-05-01');
    const newEnd = new Date('2026-05-15');

    updateSharedDate(newStart, newEnd, true, false);

    expect(sharedDateState.startDate).toBe(newStart);
    expect(sharedDateState.endDate).toBe(newEnd);
    expect(sharedDateState.isRange).toBe(true);
    expect(sharedDateState.hasFiltered).toBe(false);
  });
});
