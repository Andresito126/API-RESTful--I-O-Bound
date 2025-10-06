import { mySQLDB as pool } from '../../../core/MySQL.js';
import { v4 as uuidv4 } from 'uuid';

export class JobManagerDB {
    static async createJob(files) {
        const id = uuidv4();
        await pool.query(
            'INSERT INTO jobs (id, status, files) VALUES (?, ?, ?)',
            [id, 'pending', JSON.stringify(files)]
        );
        return { id, status: 'pending', files };
    }

    static async getJob(id) {
        const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);
        if (!rows.length) return null;
        const job = rows[0];           
        return job;                   
    }


    static async updateJob(id, updates) {
        const fields = [];
        const values = [];
        for (const key in updates) {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        }
        values.push(id);
        await pool.query(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    static async getQueue() {
        const [rows] = await pool.query('SELECT * FROM jobs WHERE status IN ("pending","processing")');
        return rows.map(job => ({ ...job, files: JSON.parse(job.files) }));
    }
}

export const jobManagerDB = new JobManagerDB();
