from app import tiger, llm
tiger.init()
for t in ["Red-vented bulbul: loud 'be-careful' call, common in parks and gardens, black crest.",
          "Indian peafowl call loudest at dawn and before monsoon; males shed train feathers in autumn.",
          "Peepal leaves turn copper before dropping; a good sensory walk without photos.",
          "Best bird activity: first 2 hours after sunrise and last hour before sunset.",
          "Sarus crane pairs call together in duet; found near wetlands and fields."]:
    tiger.add(t, llm.embed(t))
print("seeded")
