import db from '../db/dbConnection.js';

export const getBooks = (req, res) => {
    db.query("SELECT * FROM books", (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
};

export const getBook = (req, res) => {
    const bookId = req.params.id;
    db.query("SELECT * FROM books WHERE id = ?", [bookId], (err, data) => {
        if (err) return res.status(500).json(err);
        if (!data.length) return res.status(404).json("Book not found");
        return res.json(data[0]);
    });
};

export const createBook = (req, res) => {
    const q = "INSERT INTO books (`title`, `desc`, `price`, `cover`) VALUES (?)";
    const values = [req.body.title, req.body.desc, req.body.price, req.body.cover];

    db.query(q, [values], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json("Book has been created successfully");
    });
};

export const updateBook = (req, res) => {
    const bookId = req.params.id;
    const q = "UPDATE books SET `title` = ?, `desc` = ?, `price` = ?, `cover` = ? WHERE id = ?";
    const values = [req.body.title, req.body.desc, req.body.price, req.body.cover];

    db.query(q, [...values, bookId], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json("Book has been updated successfully");
    });
};

export const deleteBook = (req, res) => {
    const bookId = req.params.id;
    const q = "DELETE FROM books WHERE id = ?";

    db.query(q, [bookId], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json("Book has been deleted successfully");
    });
};