def check_horizontal(board,player):
        # Check horizontal
        for row in range(6):
            for col in range(4):
                if board[row][col] == player and \
                   board[row][col+1] == player and \
                   board[row][col+2] == player and \
                   board[row][col+3] == player:
                    return True
                
def check_vertical(board,player): 
    # Check vertical
    for col in range(7):
        for row in range(3):
            if board[row][col] == player and \
                board[row+1][col] == player and \
                board[row+2][col] == player and \
                board[row+3][col] == player:
                return True   

def check_positive_horizontal(board,player): 
    # Check positive diagonal
    for col in range(4):
        for row in range(3, 6):
            if board[row][col] == player and \
                board[row-1][col+1] == player and \
                board[row-2][col+2] == player and \
                board[row-3][col+3] == player:
                return True
            
def check_negative_horizontal(board,player): 
    # Check negative diagonal
    for col in range(4):
        for row in range(3):
            if board[row][col] == player and \
                board[row+1][col+1] == player and \
                board[row+2][col+2] == player and \
                board[row+3][col+3] == player:
                return True

def find_winning_line(board, player):
    """Return the [row, col] cells of every four-in-a-row for `player`, or []."""
    rows, cols = len(board), len(board[0])
    cells = []
    for row in range(rows):
        for col in range(cols):
            for dr, dc in ((0, 1), (1, 0), (1, 1), (-1, 1)):
                line = [(row + i * dr, col + i * dc) for i in range(4)]
                if all(0 <= r < rows and 0 <= c < cols and board[r][c] == player for r, c in line):
                    for r, c in line:
                        if [r, c] not in cells:
                            cells.append([r, c])
    return cells
