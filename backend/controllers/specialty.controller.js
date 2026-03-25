const specialtyService = require("../services/specialty.service");

exports.list = async (_req, res) => {
	try {
		const items = await specialtyService.getAllSpecialties();
		res.json(items);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
};

exports.get = async (req, res) => {
	try {
		const item = await specialtyService.getSpecialtyById(req.params.id);
		if (!item) return res.status(404).json({ error: "Not found" });
		res.json(item);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
};

exports.create = async (req, res) => {
	try {
		const { name, description } = req.body;
		if (!name || !String(name).trim()) {
			return res.status(400).json({ error: "Name is required" });
		}
		const created = await specialtyService.createSpecialty({
			name: String(name).trim(),
			description: description || null,
		});
		res.status(201).json(created);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
};

exports.update = async (req, res) => {
	try {
		const { name, description } = req.body;
		const id = req.params.id;
		const existing = await specialtyService.getSpecialtyById(id);
		if (!existing) return res.status(404).json({ error: "Not found" });
		const updated = await specialtyService.updateSpecialty(id, {
			name: String(name ?? existing.name).trim(),
			description: description ?? existing.description,
		});
		res.json(updated);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
};

exports.remove = async (req, res) => {
	try {
		const id = req.params.id;
		await specialtyService.deleteSpecialty(id);
		res.json({ success: true });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
};

