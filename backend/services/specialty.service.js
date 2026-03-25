const db = require("../config/db");

function mapSpecialty(row) {
	if (!row) return null;
	return {
		id: row.sp_id,
		name: row.sp_name,
		description: row.sp_description,
		created_at: row.created_at,
	};
}

async function getAllSpecialties() {
	try {
		const sql = `
      SELECT sp_id, sp_name, sp_description, created_at 
      FROM specialties 
      ORDER BY sp_id ASC
    `;
		const [results] = await db.query(sql);
		return results.map(mapSpecialty);
	} catch (error) {
		throw error;
	}
}

async function getSpecialtyById(id) {
	try {
		const sql = `
      SELECT sp_id, sp_name, sp_description, created_at 
      FROM specialties 
      WHERE sp_id = ?
    `;
		const [rows] = await db.query(sql, [id]);
		return mapSpecialty(rows[0]);
	} catch (error) {
		throw error;
	}
}

async function createSpecialty(data) {
	const { name, description = null } = data;
	try {
		const [result] = await db.query(
			"INSERT INTO specialties (sp_name, sp_description) VALUES (?, ?)",
			[name, description]
		);
		return {
			id: result.insertId,
			name,
			description,
		};
	} catch (error) {
		throw error;
	}
}

async function updateSpecialty(id, data) {
	const { name, description = null } = data;
	try {
		await db.query(
			"UPDATE specialties SET sp_name = ?, sp_description = ? WHERE sp_id = ?",
			[name, description, id]
		);
		return { id, name, description };
	} catch (error) {
		throw error;
	}
}

async function deleteSpecialty(id) {
	try {
		await db.query("DELETE FROM specialties WHERE sp_id = ?", [id]);
		return true;
	} catch (error) {
		throw error;
	}
}

module.exports = {
	getAllSpecialties,
	getSpecialtyById,
	createSpecialty,
	updateSpecialty,
	deleteSpecialty,
};


