const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisementController');
const upload = require('../middlewares/advertisementMiddleware');

// Move the '/create' route above the '/:position' route
router.post('/create', upload.single('image'), advertisementController.createAdvertisement);

// Re-order routes: '/:position' before '/:id'
router.get('/:position', advertisementController.getAdvertisementByPosition);
router.get('/:id', advertisementController.getAdvertisementById); 

router.get('/', advertisementController.getAllAdvertisements);
router.put('/:id', upload.single('image'), advertisementController.updateAdvertisement);
router.delete('/:id', advertisementController.deleteAdvertisement);

module.exports = router;