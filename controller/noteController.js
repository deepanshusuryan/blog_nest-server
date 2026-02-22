import Note from "../models/Note.js";

export async function createNote(req, res) {
    try {
        const { title, description, userId } = req.body;
        if (!description || !userId) {
            return res.status(400).json({ message: "Please give description and userId" })
        }

        const newNote = await Note.create({
            title, description, userId
        })
        return res.status(201).json({ message: "Note created successfully", success: true, data: newNote })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}

export async function getNotes(req, res) {
    try {
        const notes = await Note.find({});
        if (!notes) {
            return res.status(404).json({ message: "No notes found", success: false })
        }

        return res.status(200).json({ message: "Note fetched successfully", success: true, data: notes })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}

export async function getNote(req, res) {
    try {
        const note = await Note.findById(req.params.id)
        if (!note) {
            return res.status(404).json({ message: "Note not found", success: false })
        }

        return res.status(200).json({ message: "Note fetched successfully", success: true, data: note })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}

export async function updateNote(req, res) {
    try {
        const { title, description } = req.body;
        const updatedNote = await Note.findByIdAndUpdate(req.params.id, { title, description }, { new: true });

        if (!updatedNote) {
            return res.status(404).json({ message: "Note not found", success: false })
        }

        return res.status(200).json({ message: "Note updated successfully", success: true, updatedNote: updatedNote })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", succsess: false })
    }
}

export async function deleteNote(req, res) {
    try {
        const deletedNote = await Note.findByIdAndDelete(req.params.id);
        if (!deletedNote) {
            return res.status(404).json({ message: "Note not found", success: false })
        }

        return res.status(200).json({ message: "Note Deleted successfully", success: true, deletedNote: deletedNote })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error", success: false })
    }
}