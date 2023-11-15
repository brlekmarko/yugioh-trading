function getAllTournaments(){
    return "SELECT idnatjecanje, kreator, naziv, bodovipobjeda, bodoviporaz, bodovinerjeseno FROM natjecanje"
}

function getTournament(id){
    return "SELECT idnatjecanje, kreator, naziv, bodovipobjeda, bodoviporaz, bodovinerjeseno FROM natjecanje WHERE idnatjecanje = " + id;
}

function getTournamentNatjecatelji(id){
    return "SELECT idnatjecatelj, idnatjecanje, ime, bodovi FROM natjecatelj WHERE idNatjecanje = " + id;
}

function getTournamentKola(id){
    return "SELECT igra.idigra, igra.idnatjecatelj, igra.igracdvaidnatjecatelj, igra.pobjednik " +
    "FROM natjecatelj RIGHT JOIN igra " +
    "ON igra.idnatjecatelj = natjecatelj.idnatjecatelj " +
    "WHERE natjecatelj.idnatjecanje = " + id;
}

function newTournamentCreateNatjecanje(tournament){
    return "INSERT INTO natjecanje (naziv, bodoviPobjeda, bodoviPoraz, bodoviNerjeseno, kreator) VALUES ('" 
    + tournament.naziv + "', '" + tournament.bodoviPobjeda + "', '" + tournament.bodoviPoraz + "', " + tournament.bodoviNerjeseno + ", '" + tournament.kreator + "')" 
    + " RETURNING idnatjecanje;";
}

function newTournamentCreateNatjecatelji(id, tournament){
    if(tournament.natjecatelji.length == 0){
        return "";
    }
    
    let toReturn = "INSERT INTO natjecatelj (ime, idNatjecanje, bodovi) VALUES ";
    for(let i = 0; i < tournament.natjecatelji.length; i++){
        toReturn += "('" + tournament.natjecatelji[i] + "', " + id + ", 0)";
        if(i != tournament.natjecatelji.length - 1){
            toReturn += ", ";
        }
    }
    toReturn += " RETURNING idnatjecatelj;";
    return toReturn;
}

function newTournamentCreateKola(id, tournament, natjecateljiIds){
    // kreira kola gdje igra svatko sa svakim
    let kola = []; // oblika [[1,2], [1,3], [2,3]]
    if(tournament.natjecatelji.length == 4){
        kola = [[1,2], [3,4], [2,4], [1,3], [1,4], [2,3]];
    }else if(tournament.natjecatelji.length == 5){
        kola = [[1,4], [2,3], [3,1], [4,5], [3,5], [1,2], [2,5], [3,4], [2,4], [1,5]];
    }else if(tournament.natjecatelji.length == 6){
        kola = [[1,2], [3,6], [4,5], [3,4], [1,6], [2,5], [4,6], [2,3], [1,5], [1,4], [3,5], [2,6], [5,6], [1,3], [2,4]];
    }else if(tournament.natjecatelji.length == 7){
        kola = [[1,6], [2,5], [3,4], [2,4], [1,5], [6,7], [2,7], [3,6], [4,5], [3,5], [2,6], [1,7], [1,3], [4,7], [5,6], [4,6], [3,7], [1,2], [5,7], [1,4], [2,3]];
    }else if(tournament.natjecatelji.length == 8){
        kola = [[1,2], [3,8], [4,7], [5,6], [3,4], [1,7], [6,8], [2,5], [2,6], [7,8], [1,4], [3,5], [5,7], [4,8], [2,3], [1,6], [1,3], [2,4], [5,8], [6,7], [4,5], [1,8], [2,7], [3,6], [3,7], [2,8], [1,5], [4,6]];
    }

    let toReturn = "INSERT INTO igra (idNatjecatelj, igracDvaIdNatjecatelj, pobjednik) VALUES ";
    for(let i = 0; i < kola.length; i++){
        toReturn += "(" + natjecateljiIds[kola[i][0] - 1] + ", " + natjecateljiIds[kola[i][1] - 1] + ", 0)";
        if(i != kola.length - 1){
            toReturn += ", ";
        }
    }
    toReturn += " RETURNING idigra;";
    return toReturn;
}


function updatePobjednik(idigra, pobjednik){
    return "UPDATE igra SET pobjednik = \'" + pobjednik + "\' WHERE idigra = " + idigra;
}

function updateBodoviNatjecatelj(idnatjecatelj, bodovi){
    return "UPDATE natjecatelj SET bodovi = " + bodovi + " WHERE idnatjecatelj = " + idnatjecatelj;
}

function getNatjecanjaForUser(username){
    return "SELECT * FROM natjecanje WHERE kreator = '" + username + "'";
}

module.exports = {
    getAllTournaments,
    newTournamentCreateNatjecanje,
    newTournamentCreateNatjecatelji,
    newTournamentCreateKola,
    getTournament,
    getTournamentNatjecatelji,
    getTournamentKola,
    updatePobjednik,
    updateBodoviNatjecatelj,
    getNatjecanjaForUser
}
