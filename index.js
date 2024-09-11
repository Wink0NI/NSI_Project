const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cors = require('cors');
const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;




// Middleware pour gérer les données de formulaire et les JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware pour gérer les sessions
// CORS configuration
app.use(cors({
    origin: true,  // or 'null' if you are running the HTML file locally via `file://`
    credentials: true  // Allow credentials (cookies, etc.) to be sent and received
}));

// Session configuration
app.use(session({
    secret: 'votre_secret',  // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
}));

// Configuration de multer pour gérer les fichiers téléchargés
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// Fonction pour vérifier si un produit existe
function is_product(product_id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [product_id], (err, row) => {
            if (err) {
                return reject(new Error(err.message));
            }
            resolve(!!row);  // Résout à `true` si le produit existe, sinon `false`
        });
    });
}

// Fonction pour générer un ID unique
async function generate_id() {
    let id = uuidv4();

    while (true) {
        try {
            const exists = await is_product(id);
            if (!exists) {
                break;  // ID n'existe pas, on sort de la boucle
            }
            id = uuidv4();  // Génère un nouvel ID si l'ID existe déjà
        } catch (err) {
            return { message: "FAILURE" };
        }
    }

    return id;  // Retourne l'ID unique
}

// Fonction pour sauvegarder les produits dans la base de données
async function saveProducts(products) {
    try {
        const id = await generate_id();  // Génère un ID unique
        if (id.message) {
            return { message: "FAILURE" };
        }

        db.run(
            `INSERT INTO products (id, name, description, echange_type, echange_contre, category, image, owner, date_creation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, products.name, products.description, products.echange_type, products.echange_contre, products.category, products.image, products.owner, Date.now()],
            function (err) {
                console.log(err)
                if (err) {
                    return { message: "FAILURE" };
                }

            }
        );

        return { id: id, message: "SUCCESS" };
    } catch (err) {
        return { message: "FAILURE" };
    }
}


function getUser(user, callback) {
    db.get('SELECT * FROM users WHERE username = ?', [user], (err, row) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, row);
    });
}

function getUserByEmail(email, callback) {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, row);
    });
}

function getConnection(user, password, callback) {
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [user, password], (err, row) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, row);
    });
}


function addUser(username, password, email, tel, callback) {
    db.run('INSERT INTO users (username, password, email, tel) VALUES (?, ?, ?, ?)', [username, password, email, tel], (err) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
}

// Route pour vérifier la session de l'utilisateur
app.get('/check-session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, username: req.session.user.username, email: req.session.user.email, tel: req.session.user.tel });
    } else {
        res.json({ loggedIn: false });
    }
});

// Route pour gérer la connexion
app.post('/login', (req, res) => {
    const { username, password } = req.body;



    getConnection(username, password, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (user) {

            req.session.user = { username: username, email: user.mail, tel: user.tel };  // Store only necessary user info

            return res.json({ message: 'Connexion réussie' });
        } else {
            return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }
    });


});


// Route pour gérer la connexion
app.post('/register', (req, res) => {
    const { username, password, email, tel } = req.body;


    getUser(username, (err, user) => {
        if (err) {
            
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (user) return res.status(401).json({ message: "Nom d'utilisateur déjà existant" });


        
        addUser(username, password, email, tel, (err) => {
            if (err) {
                console.log(err)
                return res.status(500).json({ message: 'Error registering user' });
            }

            req.session.user = { username: username, email: email, tel: tel };
            return res.json({ message: 'Inscription réussie' });
        });

    });
});

app.get('/user/:username', (req, res) => {
    const username = req.params.username;
    getUser(username, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (user) {
            return res.json(user);
        } else {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
    })
});


// Route pour gérer la déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();  // Détruire la session
    res.json({ message: 'Déconnexion réussie' });
});

// Route pour gérer la soumission d'une nouvelle annonce
app.post('/submit-product', upload.single('productImage'), async (req, res) => {
    try {
        const { name, description, echange_type, echange_contre, productCategory } = req.body;
        const productImage = req.file ? req.file.filename : null;

        const newProduct = {
            name: name,
            description: description,
            echange_type: echange_type,
            echange_contre: echange_contre,
            category: productCategory,
            image: productImage,
            owner: req.session.user ? req.session.user.username : 'Anonyme'
        };

        const result = await saveProducts(newProduct);  // Attendez que saveProducts se termine

        if (result.message === "SUCCESS") {
            return res.json({ id: result.id, message: 'Produit soumis avec succès !' });
        } else {
            return res.status(400).json({ error: "Une erreur est survenue lors de la sauvegarde du produit." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route pour récupérer les informations d'un produit par son ID
app.get('/produit/:product_id', (req, res) => {
    const productId = req.params.product_id;

    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        res.json({ product: row });
    });
});

// Route pour récupérer la liste de tous les produits avec les informations price, type et image
app.get('/produits', (req, res) => {
    db.all('SELECT id, name, echange_type, image FROM products WHERE status = "AVAILABLE" ORDER BY date_creation DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        res.json({ produits: rows });
    });
});

app.get('/produits/:category', (req, res) => {
    const category = req.params.category;
    db.all('SELECT id, name, echange_type, echange_contre, category, image, date_creation FROM products WHERE category = ? ORDER BY date_creation DESC', [category], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        res.json({ produits: rows });
    });
});

// Définir la route /user
app.get('/user', (req, res) => {
    const utilisateur = req.session.user.username;  // Récupère la valeur du paramètre 'id'

    getUser(utilisateur, (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json({ user: user });
    });
});

// Définir la route /my_products
app.get('/my_products', (req, res) => {
    const utilisateur = req.session.user;  // Récupère la valeur du paramètre 'id'
    if (!utilisateur) {
        return res.status(401).json({ error: 'Vous devez vous connecter pour voir vos produits' });
    }

    db.all('SELECT * FROM products WHERE owner = ? ORDER BY date_creation DESC', [utilisateur.username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        if (!row) {
            return res.json({ message: 'Vide' });
        }
        res.json({ products: row });
    });
});

// Définir la route /my_products
app.post('/my_products/delete', (req, res) => {

    const { image_id } = req.body;

    db.get('DELETE FROM products WHERE id = ?', [image_id], (err) => {
        if (err) {
            return res.status(500).json({ message: "FAILURE", error: 'Erreur interne du serveur' });
        }
        return res.json({ message: 'SUCCESS' });
    });
});

// Définir la route /my_products
app.post('/my_products/edit_status/available', (req, res) => {

    const { image_id } = req.body;

    db.get('UPDATE products SET status = "AVAILABLE" WHERE id = ?', [image_id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        return res.json({ message: 'SUCCESS' });
    });
});

// Définir la route /my_products
app.post('/my_products/edit_status/finished', (req, res) => {

    const { image_id } = req.body;

    db.get('UPDATE products SET status = "OUT OF STOCK" WHERE id = ?', [image_id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        return res.json({ message: 'SUCCESS' });
    });
});


// Démarrer le serveur sur le port 3000
app.listen(port, () => {
    console.log(`Serveur en écoute sur http://localhost:${port}`);
});
