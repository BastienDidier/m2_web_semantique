import csv

file_list = "data/lieux-de-tournage-a-paris.csv"
list_selected_columns = ["id_lieu", "annee_tournage", "nom_tournage", "nom_realisateur", "adresse_lieu", "date_debut", "geo_point_2d"]
columns_row = True
columns_name = []
datas = []
with open(file_list) as csvDataFile:
    csvReader = csv.reader(csvDataFile)
    for row in csvReader:
    	print(row)
    	if columns_row:
    		columns_name = row
    	datas.append(row)
columns_index = {}

index = 0
for column in columns_name:
	if column in list_selected_columns:
		columns_index[column] = index
	index = index +1

filtered_datas = []
for data_row in datas:
	if filter_row(row, columns_name, columns_index):
		filtered_datas.append(data_row)
writing_concatenated_datas(filtered_datas, columns_name)

def writing_concatenated_datas(datas, columns_name):
	with open("test.csv", 'w') as csvfile: 
	    csvwriter = csv.writer(csvfile) 
	    csvwriter.writerow(columns_name) 
	    csvwriter.writerows(datas)

def contains_digits(s):
    return any(char.isdigit() for char in s)

def filter_row(row, columns_row, columns_index):
	filters = True
	if len(row) != 16:
		filters = False
	for column in columns_index:
		if row[columns_index[column]] == None:
			filters = False
	if not row[columns_index["annee_tournage"]].isdigit() :
		filters = False
	if contains_digits(row[columns_index["nom_realisateur"]]) :
		filters = False
	return filters 
