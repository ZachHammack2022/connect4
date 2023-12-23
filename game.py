class Connect4:
    def __init__(self):
        self.board = [[' ' for _ in range(7)] for _ in range(6)]
        self.current_player = 'X'
        self.game_over = False

    def display_board(self):
        print(" 0 1 2 3 4 5 6")
        for row in self.board:
            print('|' + '|'.join(row) + '|')

    def make_move(self, column):
        for row in reversed(self.board):
            if row[column] == ' ':
                row[column] = self.current_player
                return True
        return False
    
    def check_horizontal(self):
        # Check horizontal
        for row in range(6):
            for col in range(4):
                if self.board[row][col] == self.current_player and \
                   self.board[row][col+1] == self.current_player and \
                   self.board[row][col+2] == self.current_player and \
                   self.board[row][col+3] == self.current_player:
                    return True
                
    def check_vertical(self): 
        # Check vertical
        for col in range(7):
            for row in range(3):
                if self.board[row][col] == self.current_player and \
                   self.board[row+1][col] == self.current_player and \
                   self.board[row+2][col] == self.current_player and \
                   self.board[row+3][col] == self.current_player:
                    return True   
    
    def check_positive_horizontal(self): 
        # Check positive diagonal
        for col in range(4):
            for row in range(3, 6):
                if self.board[row][col] == self.current_player and \
                   self.board[row-1][col+1] == self.current_player and \
                   self.board[row-2][col+2] == self.current_player and \
                   self.board[row-3][col+3] == self.current_player:
                    return True
                
    def check_negative_horizontal(self): 
        # Check negative diagonal
        for col in range(4):
            for row in range(3):
                if self.board[row][col] == self.current_player and \
                   self.board[row+1][col+1] == self.current_player and \
                   self.board[row+2][col+2] == self.current_player and \
                   self.board[row+3][col+3] == self.current_player:
                    return True
        

    def check_winner(self):
 
        if self.check_horizontal() or \
            self.check_vertical() or \
            self.check_positive_horizontal() or \
            self.check_negative_horizontal():
            return True
        
        return False

    def switch_player(self):
        self.current_player = 'O' if self.current_player == 'X' else 'X'

    def play_game(self):
        while not self.game_over:
            self.display_board()
            try:
                column = int(input(f"Player {self.current_player}, choose a column (0-6): "))
                if column < 0 or column > 6:
                    raise ValueError
            except ValueError:
                print("Invalid column. Try again.")
                continue

            if not self.make_move(column):
                print("Column is full. Try a different one.")
                continue

            if self.check_winner():
                self.display_board()
                print(f"Player {self.current_player} wins!")
                self.game_over = True
            else:
                self.switch_player()

        print("Game over!")

if __name__ == "__main__":
    game = Connect4()
    game.play_game()
