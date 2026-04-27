import { Insights } from '@chess/services/insights/insights.dto';
import { mockResizeObserver } from '@chess/utils/tests/mock-resize-observer';
import { render } from '@testing-library/react';
import { InsightsCalendarTimeOfDays } from '..';

describe('InsightsCalendarTimeOfDays', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsCalendarTimeOfDays insights={{} as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
