const Client = require('../models/client.model');

exports.createClient = async (req, res) => {
    try {
        const { fullName, contactDetails } = req.body;

        if(!fullName || contactDetails) {
            res.status(404).json({ message: "client details must be submitted" })
        }

        const newClient = new Client({
            fullName, 
            contactDetails
        })
        await newClient.save();

        res.status(201).json({ message: "Client created successfully", newClient })
    } catch (error) {
        res.status(500).json({ error })
        console.log(error)
    }
}

exports.getSingleClient = async (req, res) => {
    const { id } = req.params;

    try {
        const foundClient = await Client.findOneById(id);

        if(!foundClient) {
            res.status(404).json({ message: "No Client found!" })
        }

        res.status(200).json({ message: "Client found successfully!", foundClient});
    } catch (error) {
        res.status(500).josn({ message: "Internal server error", error })
    }
}

exports.getAllClients = async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 })
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get  clients.' });
    }
};

exports.deleteSingleClient = async (req, res) => {
    const { id } = req.params;
    console.log(req.params.ClientId)

    try {
        const foundClient = await Client.findByIdAndDelete(req.params.ClientId);
        if(!foundClient) {
            res.status(404).json({ message: "No Client found!" })
        }
        res.status(200).json({ message: "Client successfully deleted!" })
    } catch (error) {
        res.status(500).json({ error: "Failed to delete Client!" })
    }
}

exports.updateClient = async (req, res) => {
    try {
        const { ClientId } = req.params;
        const updates = req.body;

        const updatedClient = await Client.findByIdAndUpdate(ClientId, updates, { new: true });
        if (!updatedClient) return res.status(404).json({ message: 'Client not found.' });

        res.status(200).json({ message: 'Client updated successfully.', Client: updatedClient });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update Client.' });
    }
};