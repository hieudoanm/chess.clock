import { render } from '@testing-library/react';
import { CardHeading } from '..';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    asPath: '',
    events: { on: jest.fn(), off: jest.fn() },
  }),
}));

describe('CardHeading', () => {
  it('to match snapshot', () => {
    const { container } = render(<CardHeading />);
    expect(container).toMatchSnapshot();
  });
});
