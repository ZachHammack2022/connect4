class Player:
    def __init__(self,name,display_name):
        self.name=name
        self.display_name=display_name
        
    def make_move(self, obs):
        raise NotImplementedError
    

