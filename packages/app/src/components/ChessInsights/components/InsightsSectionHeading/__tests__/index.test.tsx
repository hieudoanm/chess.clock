import { render } from '@testing-library/react';
import { SectionHeading } from '..';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    asPath: '',
    events: { on: jest.fn(), off: jest.fn() },
  }),
}));

describe('SectionHeading', () => {
  it('to match snapshot', () => {
    const { container } = render(<SectionHeading />);
    expect(container).toMatchSnapshot();
  });
});
