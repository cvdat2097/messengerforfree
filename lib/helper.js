module.exports = {
    GenerateID: function (length = 20) {
        let id = "";

        for (let i = 0; i < length; i++) {
            let seedNumber;
            do {
                seedNumber = Math.floor(Math.random() * 100);
            } while (!((seedNumber >= 48 && seedNumber <= 57)
                || (seedNumber >= 65 && seedNumber <= 90)
                || (seedNumber >= 97 && seedNumber <= 122)));

            id += String.fromCharCode(seedNumber)
        }

        return id;
    }
}