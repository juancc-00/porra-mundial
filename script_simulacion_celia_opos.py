import numpy as np
import itertools
n_temas = np.array([3,0,0,0,4,4,3,0,11,0,0])


desplegado = np.repeat(np.arange(11), n_temas)
combinaciones = list(itertools.combinations(desplegado, 2))

nota_esperada = np.mean(np.array(combinaciones)[:,1])
print(nota_esperada)
# print(np.shape(combinaciones))

