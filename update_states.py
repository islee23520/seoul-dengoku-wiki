import os

states = {
    "01": "한재목",
    "02": "강민서",
    "03": "정호준",
    "04": "오경재",
    "05": "배우진",
    "06": "윤서린",
    "07": "박태겸",
    "08": "오해린",
    "09": "최지우",
    "10": "백온",
    "11": "이홍원",
    "12": "장세화",
    "13": "류은비",
    "14": "고서준",
    "15": "남윤경",
    "16": "정유라"
}

# Now for each state, read the leader info from Core-Characters.md
# I will use a simple regex or parsing to get the content.

def get_leader_content(name):
    # This is a bit manual but since the file is structured, it's fine.
    # Actually, I can just use the read command to fetch the content once, 
    # and then parse in python.
    pass
