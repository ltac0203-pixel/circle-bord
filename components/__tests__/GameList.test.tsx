import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render, createMockGame } from '../../test-utils/render'
import GameList from '../GameList'
import { applyForGame } from '../../app/actions/games'

// Mock the Server Action
jest.mock('../../app/actions/games', () => ({
  applyForGame: jest.fn()
}))

const mockApplyForGame = applyForGame as jest.MockedFunction<typeof applyForGame>

describe('GameList', () => {
  beforeEach(() => {
    mockApplyForGame.mockClear()
  })

  it('renders list of games correctly', () => {
    const mockGames = [
      createMockGame({ 
        id: '1', 
        team_name: 'チーム1', 
        date: '2025-12-01' 
      }),
      createMockGame({ 
        id: '2', 
        team_name: 'チーム2', 
        date: '2025-12-02' 
      })
    ]

    render(<GameList games={mockGames} />)

    expect(screen.getByText('チーム1')).toBeInTheDocument()
    expect(screen.getByText('チーム2')).toBeInTheDocument()
    expect(screen.getByText('2025/12/1')).toBeInTheDocument()
    expect(screen.getByText('2025/12/2')).toBeInTheDocument()
  })

  it('shows empty state when no games available', () => {
    render(<GameList games={[]} />)

    expect(screen.getByText('現在、登録されている試合はありません')).toBeInTheDocument()
  })

  it('marks games as applied when in initialApplications', () => {
    const mockGames = [
      createMockGame({ id: '1', team_name: 'チーム1' }),
      createMockGame({ id: '2', team_name: 'チーム2' })
    ]

    render(<GameList games={mockGames} initialApplications={['1']} />)

    // First game should show applied status
    expect(screen.getByText('申請済み')).toBeInTheDocument()
    
    // Second game should show apply button
    expect(screen.getByRole('button', { name: '申請する' })).toBeInTheDocument()
  })

  it('performs optimistic update when applying for game', async () => {
    const mockGames = [createMockGame({ id: '1', team_name: 'テストチーム' })]
    mockApplyForGame.mockResolvedValue({ success: true })

    render(<GameList games={mockGames} />)

    const applyButton = screen.getByRole('button', { name: '申請する' })
    fireEvent.click(applyButton)

    // Should immediately show applied state (optimistic update)
    expect(screen.getByText('申請済み')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '申請する' })).not.toBeInTheDocument()

    // Should call the server action
    expect(mockApplyForGame).toHaveBeenCalledWith('1')
  })

  it('shows error message when application fails', async () => {
    const mockGames = [createMockGame({ id: '1', team_name: 'テストチーム' })]
    mockApplyForGame.mockResolvedValue({ 
      success: false, 
      error: 'テスト用エラーメッセージ' 
    })

    render(<GameList games={mockGames} />)

    const applyButton = screen.getByRole('button', { name: '申請する' })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(screen.getByText('テスト用エラーメッセージ')).toBeInTheDocument()
    })

    // Error message should have error styling
    const errorElement = screen.getByText('テスト用エラーメッセージ')
    expect(errorElement.closest('div')).toHaveClass('bg-red-50', 'text-red-700')
  })

  it('shows generic error message when application throws exception', async () => {
    const mockGames = [createMockGame({ id: '1', team_name: 'テストチーム' })]
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockApplyForGame.mockRejectedValue(new Error('Network error'))

    render(<GameList games={mockGames} />)

    const applyButton = screen.getByRole('button', { name: '申請する' })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(screen.getByText('申請に失敗しました')).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith('Application failed:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('clears error message when making new application', async () => {
    const mockGames = [
      createMockGame({ id: '1', team_name: 'チーム1' }),
      createMockGame({ id: '2', team_name: 'チーム2' })
    ]
    
    // First application fails
    mockApplyForGame.mockResolvedValueOnce({ 
      success: false, 
      error: 'エラーメッセージ' 
    })
    
    // Second application succeeds
    mockApplyForGame.mockResolvedValueOnce({ success: true })

    render(<GameList games={mockGames} />)

    // Apply for first game (fails)
    const firstApplyButton = screen.getAllByRole('button', { name: '申請する' })[0]
    fireEvent.click(firstApplyButton)

    await waitFor(() => {
      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument()
    })

    // Apply for second game (should clear error)
    const secondApplyButton = screen.getAllByRole('button', { name: '申請する' })[1]
    fireEvent.click(secondApplyButton)

    expect(screen.queryByText('エラーメッセージ')).not.toBeInTheDocument()
  })

  it('renders correct number of game cards', () => {
    const mockGames = Array.from({ length: 5 }, (_, i) => 
      createMockGame({ 
        id: `${i + 1}`, 
        team_name: `チーム${i + 1}` 
      })
    )

    render(<GameList games={mockGames} />)

    mockGames.forEach((_, i) => {
      expect(screen.getByText(`チーム${i + 1}`)).toBeInTheDocument()
    })
  })

  it('handles multiple applications correctly', async () => {
    const mockGames = [
      createMockGame({ id: '1', team_name: 'チーム1' }),
      createMockGame({ id: '2', team_name: 'チーム2' })
    ]
    
    mockApplyForGame.mockResolvedValue({ success: true })

    render(<GameList games={mockGames} />)

    const applyButtons = screen.getAllByRole('button', { name: '申請する' })
    
    // Apply for both games
    fireEvent.click(applyButtons[0])
    fireEvent.click(applyButtons[1])

    // Both should show applied status
    await waitFor(() => {
      expect(screen.getAllByText('申請済み')).toHaveLength(2)
    })

    // Should call server action for both
    expect(mockApplyForGame).toHaveBeenCalledWith('1')
    expect(mockApplyForGame).toHaveBeenCalledWith('2')
    expect(mockApplyForGame).toHaveBeenCalledTimes(2)
  })
})