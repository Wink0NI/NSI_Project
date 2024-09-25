const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cors = require('cors');
const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');

// Chiffrer un message

const app = express();
const port = 3000;

const key = 'MessageSecret';




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

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory where files will be saved
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize multer with storage configuration
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
            `INSERT INTO products (id, name, description, echange_type, echange_contre, category, owner, date_creation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, products.name, products.description, products.echange_type, products.echange_contre, products.category, products.owner, Date.now()],
            function (err) {
                if (err) {
                    return { message: "FAILURE" };
                }

            }
        );

        products.images.forEach(image => {
            db.run(
                `INSERT INTO post_image (post_id, image) VALUES (?, ?)`,
                [id, image], // Include the image parameter here
                function (err) {
                    if (err) {
                        console.error(err); // Log the error for debugging
                        return { message: "FAILURE" };
                    }
                }
            );
        });

        return { id: id, message: "SUCCESS" };
    } catch (err) {
        return { message: "FAILURE" };
    }
}


function getUser(username, callback) {
    // Récupérer tous les utilisateurs
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            return callback(err, null);
        }

        // Itérer sur chaque utilisateur
        for (let user of rows) {

            // Déchiffrer le nom d'utilisateur
            const decryptedUsername = CryptoJS.AES.decrypt(user.username, key).toString(CryptoJS.enc.Utf8);

            // Comparer le nom d'utilisateur déchiffré avec le nom d'utilisateur fourni
            if (decryptedUsername === username) {
                // Ne pas déchiffrer le mot de passe ici pour des raisons de sécurité
                user.password = "PRIVATE"; // On cache le mot de passe
                return callback(null, user);
            }

        }

        // Si aucun utilisateur n'a été trouvé
        return callback(null, null);
    });
}




function getConnection(user, password, callback) {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            return callback(err, null);
        }

        // Filtrer les utilisateurs pour trouver celui qui correspond au nom d'utilisateur donné
        rows.filter(row => CryptoJS.AES.decrypt(row.username, key).toString(CryptoJS.enc.Utf8) === user && CryptoJS.AES.decrypt(row.password, key).toString(CryptoJS.enc.Utf8) === password);

        // Vérifier si un utilisateur a été trouvé
        if (rows.length > 0) {
            return callback(null, rows[0]);
        } else {
            // Si aucun utilisateur n'a été trouvé
            return callback(null, null);
        }
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

function decryptUser(user) {
    user.username = CryptoJS.AES.decrypt(user.username, key).toString(CryptoJS.enc.Utf8);
    user.password = "SECRET";
    user.email = user.email ? CryptoJS.AES.decrypt(user.email, key).toString(CryptoJS.enc.Utf8) : "";
    user.tel = user.tel ? CryptoJS.AES.decrypt(user.tel, key).toString(CryptoJS.enc.Utf8) : "";
    return user;

}

async function decryptProduct(product) {
    const decryptField = (field) => field ? CryptoJS.AES.decrypt(field, key).toString(CryptoJS.enc.Utf8) : "";

    // Decrypt product fields
    product.name = decryptField(product.name);
    product.description = decryptField(product.description);
    product.echange_type = decryptField(product.echange_type);
    product.echange_contre = decryptField(product.echange_contre);
    product.category = decryptField(product.category);
    product.owner = decryptField(product.owner);

    // Retrieve images associated with the product
    try {
        const images = await new Promise((resolve, reject) => {
            db.all('SELECT image FROM post_image WHERE post_id = ?', [product.id], (err, rows) => {
                if (err) {
                    return reject(new Error('Erreur interne du serveur: ' + err.message));
                }
                resolve(rows); // rows will contain an array of images
            });
        });

        images.forEach(image => {
            image.image = decryptField(image.image);
        });

        product.images = images; // Assign images to the product
        return product; // Return the decrypted product

    } catch (error) {
        console.error(error.message); // Log error for debugging
        throw error; // Re-throw error for handling in the calling function
    }

    
}

async function decryptProducts(products) {
    try {
        const decryptedProducts = await Promise.all(products.map(product => decryptProduct(product)));
        return decryptedProducts; // Return all decrypted products
    } catch (error) {
        console.error(error.message); // Log error for debugging
        throw error; // Re-throw error for handling in the calling function
    }
}


// Route pour gérer la connexion
app.post('/login', (req, res) => {
    const { username, password } = req.body;



    getConnection(username, password, (err, user) => {
        if (err) {
            console.error(err);
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



        addUser(
            CryptoJS.AES.encrypt(username, key).toString(),
            CryptoJS.AES.encrypt(password, key).toString(),
            CryptoJS.AES.encrypt(email, key).toString(),
            CryptoJS.AES.encrypt(tel, key).toString(),
            (err) => {
                if (err) {
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
            user = decryptUser(user);
            return res.json(user);
        } else {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
    });
});



// Route pour gérer la déconnexion
app.get('/logout', (req, res) => {
    req.session.destroy();  // Détruire la session
    res.json({ message: 'Déconnexion réussie' });
});

// Route pour gérer la soumission d'une nouvelle annonce
app.post('/submit-product', upload.array('productImage', 32), async (req, res) => { // 10 is the max number of files you want to allow
    try {
        const { name, description, echange_type, echange_contre, productCategory } = req.body;
        const productImages = req.files ? req.files.map(file => CryptoJS.AES.encrypt(file.filename, key).toString()) : [];



        const newProduct = {
            name: CryptoJS.AES.encrypt(name, key).toString(),
            description: CryptoJS.AES.encrypt(description, key).toString(),
            echange_type: CryptoJS.AES.encrypt(echange_type, key).toString(),
            echange_contre: CryptoJS.AES.encrypt(echange_contre, key).toString(),
            category: CryptoJS.AES.encrypt(productCategory, key).toString(),
            images: productImages,
            owner: CryptoJS.AES.encrypt(req.session.user ? req.session.user.username : 'Anonyme', key).toString()
        };

        const result = await saveProducts(newProduct);

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
app.get('/produit/:product_id', async (req, res) => {
    const productId = req.params.product_id;

    try {
        // Fetch the product from the database
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
                if (err) {
                    return reject(new Error('Erreur interne du serveur'));
                }
                resolve(row);
            });
        });

        // Handle case where the product is not found
        if (!row) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        // Decrypt the product
        const decryptedProduct = await decryptProduct(row);

        // Return the decrypted product
        return res.json({ product: decryptedProduct });

    } catch (error) {
        console.error('Error fetching product:', error.message);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Route pour récupérer la liste de tous les produits avec les informations price, type et image
app.get('/produits', async (req, res) => {
    try {
        // Fetch available products from the database
        const rows = await new Promise((resolve, reject) => {
            const query = `
                SELECT id, name, echange_type 
                FROM products 
                WHERE status = "AVAILABLE" 
                ORDER BY date_creation DESC
            `;
            db.all(query, [], (err, rows) => {
                if (err) {
                    return reject(new Error('Erreur interne du serveur' + err.message));
                }
                resolve(rows);
            });
        });

        // Decrypt the product details
        const decryptedProducts = await decryptProducts(rows);

        // Return the decrypted products
        return res.json({ produits: decryptedProducts });

    } catch (error) {
        console.error('Error fetching products:', error.message);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});


app.get('/produits/:category', async (req, res) => {
    const category = req.params.category;

    try {
        // Fetch products directly from the database, filtering by decrypted category
        const rows = await new Promise((resolve, reject) => {
            const query = `
                SELECT id, name, echange_type, echange_contre, category, date_creation 
                FROM products 
                WHERE status = "AVAILABLE" 
                ORDER BY date_creation DESC
            `;
            db.all(query, [], (err, rows) => {
                if (err) {
                    return reject(new Error('Erreur interne du serveur'));
                }
                resolve(rows);
            });
        });

        // Filter rows based on decrypted category
        const filteredRows = rows.filter(row => {
            const decryptedCategory = CryptoJS.AES.decrypt(row.category, key).toString(CryptoJS.enc.Utf8);
            return decryptedCategory === category;
        });

        // Decrypt the product details
        const decryptedProducts = await decryptProducts(filteredRows);

        // Return the filtered and decrypted products
        return res.json({ produits: decryptedProducts });

    } catch (error) {
        console.error('Error fetching products:', error.message);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});


// Définir la route /user
app.get('/user', (req, res) => {
    const utilisateur = req.session.user;  // Récupère la valeur du paramètre 'id'

    if (!utilisateur) {
        return res.json({ error: 'Vous devez vous connecter pour voir vos informations' });
    }

    getUser(utilisateur.username, (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json({ user: decryptUser(user) });
    });
});

// Définir la route /my_products
app.get('/my_products', async (req, res) => {
    const utilisateur = req.session.user;  // Get the user from the session
    if (!utilisateur) {
        return res.status(401).json({ error: 'Vous devez vous connecter pour voir vos produits' });
    }

    try {
        // Fetch all products owned by the user from the database
        const rows = await new Promise((resolve, reject) => {
            const query = 'SELECT * FROM products ORDER BY date_creation DESC';
            db.all(query, [], (err, rows) => {
                if (err) {
                    return reject(new Error('Erreur interne du serveur'));
                }
                resolve(rows);
            });
        });

        // Filter rows based on the owner
        const filteredRows = rows.filter((annonce) => {
            const decryptedOwner = CryptoJS.AES.decrypt(annonce.owner, key).toString(CryptoJS.enc.Utf8);
            return decryptedOwner === utilisateur.username;
        });

        // Check if no products were found
        if (filteredRows.length === 0) {
            return res.json({ message: 'Aucun produit trouvé.' });
        }

        // Decrypt the product details
        const decryptedProducts = await decryptProducts(filteredRows);
        return res.json({ products: decryptedProducts });

    } catch (error) {
        console.error('Error fetching user products:', error.message);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});


// Définir la route /my_products
app.post('/my_products/delete', async (req, res) => {
    const { image_id } = req.body;

    if (!image_id) {
        return res.status(400).json({ error: 'ID de l\'image requis' });
    }

    try {
        // Fetch the product with the provided ID
        const productRow = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM products WHERE id = ?', [image_id], (err, row) => {
                if (err) {
                    return reject(new Error('Erreur interne du serveur'));
                }
                resolve(row);
            });
        });

        if (!productRow) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        // Decrypt the product details
        const decryptedProduct = decryptProduct(productRow);

        // Fetch associated images from the post_image table
        const images = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM post_image WHERE post_id = ?', [image_id], (err, rows) => {
                if (err) {
                    return reject(new Error('Erreur interne du serveur'));
                }
                resolve(rows);
            });
        });

        // Delete images from the post_image table
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM post_image WHERE post_id = ?', [image_id], function(err) {
                if (err) {
                    return reject(new Error('Erreur interne du serveur'));
                }
                resolve(this.changes); // number of rows deleted
            });
        });

        // Delete image files from the file system
        images.forEach(image => {
            image.image = CryptoJS.AES.decrypt(image, key).toString(CryptoJS.enc.Utf8)
            
            const imagePath = path.join(__dirname, 'uploads', image.image); // Assuming 'image' is the file name in the post_image table
            try {
                fs.unlinkSync(imagePath);
            } catch (err) {
                console.error(`Erreur lors de la suppression de l'image ${image.image}: ${err.message}`);
            }
        });

        // Delete the product from the products table
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM products WHERE id = ?', [image_id], (deleteErr) => {
                if (deleteErr) {
                    return reject(new Error('Erreur interne du serveur'));
                }
                resolve();
            });
        });

        return res.json({ message: 'Produit et images supprimés avec succès' });

    } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error.message);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
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
