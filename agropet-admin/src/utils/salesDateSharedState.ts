export interface SharedDateState {
  startDate: Date;
  endDate: Date;
  isRange: boolean;
  hasFiltered: boolean;
}

export const sharedDateState: SharedDateState = {
  startDate: new Date(),
  endDate: new Date(),
  isRange: false,
  hasFiltered: true,
};

export const updateSharedDate = (
  start: Date,
  end: Date,
  range: boolean,
  filtered: boolean
) => {
  sharedDateState.startDate = start;
  sharedDateState.endDate = end;
  sharedDateState.isRange = range;
  sharedDateState.hasFiltered = filtered;
};
