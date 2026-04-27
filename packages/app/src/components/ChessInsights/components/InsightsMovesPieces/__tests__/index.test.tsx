import { Insights } from '@chess/services/insights/insights.dto';
import { mockResizeObserver } from '@chess/utils/tests/mock-resize-observer';
import { render } from '@testing-library/react';
import { InsightsMovesPieces } from '..';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    asPath: '',
    events: { on: jest.fn(), off: jest.fn() },
  }),
  usePathname: jest.fn().mockReturnValue(''),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

describe('InsightsMovesPieces', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsMovesPieces insights={{} as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
