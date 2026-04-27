import { Insights } from '@chess/services/insights/insights.dto';
import { mockResizeObserver } from '@chess/utils/tests/mock-resize-observer';
import { render } from '@testing-library/react';
import { InsightsOpponents } from '..';

describe('InsightsOpponents', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsOpponents insights={{ opponents: [] } as unknown as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
