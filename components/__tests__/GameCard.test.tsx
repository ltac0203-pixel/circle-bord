import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render, createMockGame } from '../../test-utils/render'
import GameCard from '../GameCard'

const mockOnApply = jest.fn()

describe('GameCard', () => {
  beforeEach(() => {
    mockOnApply.mockClear()
  })

  it('renders game information correctly', () => {
    const mockGame = createMockGame({
      team_name: 'テストチーム',
      date: '2025-12-01',
      time: '14:00',
      location: 'テスト体育館',
      participants: 10,
      description: 'テスト試合です'
    })

    render(<GameCard game={mockGame} onApply={mockOnApply} />)

    expect(screen.getByText('テストチーム')).toBeInTheDocument()
    expect(screen.getByText('2025/12/1')).toBeInTheDocument()
    expect(screen.getByText('14:00')).toBeInTheDocument()
    expect(screen.getByText('テスト体育館')).toBeInTheDocument()
    expect(screen.getByText('10人')).toBeInTheDocument()
    expect(screen.getByText('テスト試合です')).toBeInTheDocument()
  })

  it('shows apply button for games not yet applied to', () => {
    const mockGame = createMockGame({ hasApplied: false })

    render(<GameCard game={mockGame} onApply={mockOnApply} />)

    const applyButton = screen.getByRole('button', { name: '申請する' })
    expect(applyButton).toBeInTheDocument()
    expect(applyButton).not.toBeDisabled()
  })

  it('shows applied status for games already applied to', () => {
    const mockGame = createMockGame({ hasApplied: true })

    render(<GameCard game={mockGame} onApply={mockOnApply} />)

    expect(screen.getByText('申請済み')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '申請する' })).not.toBeInTheDocument()
  })

  it('calls onApply when apply button is clicked', async () => {
    const mockGame = createMockGame({ hasApplied: false })

    render(<GameCard game={mockGame} onApply={mockOnApply} />)

    const applyButton = screen.getByRole('button', { name: '申請する' })
    fireEvent.click(applyButton)

    expect(mockOnApply).toHaveBeenCalledWith(mockGame.id)
  })

  it('shows loading state while applying', async () => {
    const mockGame = createMockGame({ hasApplied: false })
    mockOnApply.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<GameCard game={mockGame} onApply={mockOnApply} />)

    const applyButton = screen.getByRole('button', { name: '申請する' })
    fireEvent.click(applyButton)

    expect(screen.getByText('申請中...')).toBeInTheDocument()
    expect(applyButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText('申請する')).toBeInTheDocument()
    })
  })

  it('handles apply failure gracefully', async () => {
    const mockGame = createMockGame({ hasApplied: false })
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockOnApply.mockRejectedValue(new Error('Network error'))

    render(<GameCard game={mockGame} onApply={mockOnApply} />)

    const applyButton = screen.getByRole('button', { name: '申請する' })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Application failed:', expect.any(Error))
      expect(screen.getByText('申請する')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('does not render description when not provided', () => {
    const mockGame = createMockGame({ description: '' })

    render(<GameCard game={mockGame} onApply={mockOnApply} />)

    expect(screen.queryByText('テスト試合です')).not.toBeInTheDocument()
  })

  it('prevents multiple apply attempts', async () => {
    const mockGame = createMockGame({ hasApplied: false })
    mockOnApply.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<GameCard game={mockGame} onApply={mockOnApply} />)

    const applyButton = screen.getByRole('button', { name: '申請する' })
    
    // Click multiple times rapidly
    fireEvent.click(applyButton)
    fireEvent.click(applyButton)
    fireEvent.click(applyButton)

    // Should only be called once
    expect(mockOnApply).toHaveBeenCalledTimes(1)
  })

  it('applies hover effects correctly', () => {
    const mockGame = createMockGame()

    render(<GameCard game={mockGame} onApply={mockOnApply} />)

    const cardElement = screen.getByText('テストチーム').closest('div')
    expect(cardElement).toHaveClass('hover:shadow-md', 'transition-shadow')
  })
})