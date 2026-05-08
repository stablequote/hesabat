const Vendor = require("../models/vendor.model");

exports.addVendor = async (req, res) => {
    try {
        const { name, vendorID, contactDetails } = req.body;

        if(!name || contactDetails) {
          res.status(404).json({ message: "vendor details must be submitted" })
        }

        const newVendor = new Vendor({
          name, 
          vendorID, 
          contactDetails
        });

        await newVendor.save();
        res.status(201).json({ message: 'Vendor added successfully.', vendor: newVendor });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add vendor.' });
    }
};

// list all vendors
exports.listVendors = async (req, res) => {
    try {
        const vendor = await Vendor.find({})

        if(!vendor) {
            res.status(404).json({ message: 'No vendor found on the database.' }); 
        }
        res.status(200).json({ message: 'vendors fetched successfully.', vendor: vendor });
    } catch (error) {
        res.send(error)
    }
}

// list a single vendor
exports.listSingleVendor= async (req, res) => {
    try {
        const { name } = req.body;
        const vendor = await Vendor.findOne({name})
         if(!vendor) {
            res.status(404).json({ message: 'No vendor found on the database.' }); 
        }
        res.status(200).json({ message: 'vendors fetched successfully.', vendor: vendor });
    } catch (error) {
        res.send(error)
    }
}

// list all invoices by a vendors
exports.listVendorInvoices = async (req, res) => {
  try {
    const { vendorId } = req.query; // Extract vendorId from query parameters

    if (!vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    // Find the vendor and populate its invoices
    const vendor = await Vendor.findById(vendorId)
      .populate({
        path: "invoices",
        populate: [
          {
            path: "products.product",
            select: "product unitPurchasePrice",
          },
          {
            path: "vendor", // populate vendor inside each order
            // select: "name email phone", // optional: choose fields
          },
        ],
      })
      .lean();

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    vendor.invoices = vendor?.invoices?.map(order => ({
      ...order,
      products: invoices.products.map(p => ({
        ...p,
        product: p.product.product, // Extract actual product name
      })),
    }));

    res.status(200).json({
      message: 'Orders fetched successfully',
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        vendorID: vendor.vendorID,
        invoices: vendor.invoices, // List of invoices belonging to the vendor
      },
    });
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}