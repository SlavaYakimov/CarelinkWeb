// @vitest-environment jsdom
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlugInput } from '@/components/carelink/SlugInput';

function SlugHarness() {
  const [value, setValue] = React.useState('');
  return <SlugInput id="slug" name="slug" value={value} onChange={setValue} />;
}

describe('SlugInput', () => {
  it('lowercases and maps spaces to hyphen', async () => {
    const user = userEvent.setup();
    render(<SlugHarness />);
    const input = screen.getByPlaceholderText('ivanovy');
    await user.type(input, 'Ivanov Y');
    expect(input).toHaveValue('ivanov-y');
  });

  it('does not append cyrillic', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SlugInput id="slug" name="slug" value="abc" onChange={onChange} />);
    const input = screen.getByPlaceholderText('ivanovy');
    await user.type(input, 'я');
    expect(onChange).not.toHaveBeenCalledWith(expect.stringContaining('я'));
  });
});
