const express = require('express');
const router = express.Router();
const ideaController = require('../controllers/ideaController');

router.post('/', ideaController.createIdea);
router.get('/', ideaController.getIdeas);
router.put('/:id', ideaController.updateIdea);
router.delete('/:id', ideaController.deleteIdea);

module.exports = router;