const db = require('../../configs/db')
const logger = require('../../configs/logger')



module.exports = {
    getData: async (req, res) => {
        try {
            let sql = 'select * from noted where status = 1 order by id desc';
            const result = await db.query(sql);
            return res.json({ success: true, status: 200, message: "Lấy dữ liệu thành công", data: { notedlist: result } });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    getContent: async (req, res) => {
        try {
            const { notedId } = req.query;

            if (!notedId)
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' })

            const result = await db.query('select content from noted where id = ?', notedId);
            return res.json({ success: true, status: 200, message: "Lấy dữ liệu thành công", data: result });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    searchNoted: async (req, res) => {
        try {
            const {searchKey } = req.query;

            let sql = 'select * from noted where namelist like ? and status = ? order by id desc'
            const result = await db.query(sql, [userId, `%${searchKey}%`, 1]);
            return res.json({ success: true, status: 200, message: "Lấy dữ liệu thành công", data: { notedlist: result } });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    insertNoted: async (req, res) => {
        try {
            const { NameList } = req.body;

            const AtCreate = new Date().toISOString().slice(0, 16);
            const Content = `<span>Chưa có nội dung được thêm vào</span>`;

            // Thực hiện truy vấn
            let sql = 'insert into noted (namelist, content, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?)';
            await db.query(sql, [NameList, Content, AtCreate, AtCreate, 1]);
            return res.json({ success: true, status: 201, message: "Thêm ghi chú thành công" });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    updateNoted: async (req, res) => {
        try {
            const { notedId, nameList, content } = req.body;

            if (!notedId)
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' });

            await db.query('update noted set namelist = ?, content = ? where id = ?', [nameList, content, notedId])
            return res.json({ success: true, status: 200, message: "Cập nhật ghi chú thành công" });
        } catch (e) {
            logger.error(e)
            return res.json({ success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },

    deleteNoted: async (req, res) => {
        try {
            const { IdNoted } = req.body;

            if (!IdNoted)
                return res.json({ success: false, status: 400, message: 'Dữ liệu yêu cầu không hợp lệ' });

            await db.query('delete from noted where id = ?', [IdNoted]);
            return res.json({ success: true, status: 200, message: 'Xoá ghi chú thành công' });
        } catch (e) {
            logger.error(e)
            return res.json({success: false, status: 500, message: 'Lỗi máy chủ nội bộ' });
        }
    },
}