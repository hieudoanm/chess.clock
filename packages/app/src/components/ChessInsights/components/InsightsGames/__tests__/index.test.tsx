import { Insights } from '@chess/services/insights/insights.dto';
import { mockResizeObserver } from '@chess/utils/tests/mock-resize-observer';
import { render } from '@testing-library/react';
import { InsightsGames } from '..';

describe('InsightsGames', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(<InsightsGames insights={{} as Insights} />);
    expect(container).toMatchSnapshot();
  });
});
