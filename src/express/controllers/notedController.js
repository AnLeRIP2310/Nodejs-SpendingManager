const db = require('../../configs/db')
const logger = require('../../configs/logger')


module.exports = {
    getData: async (req, res) => {
        try {
            const { token } = req.query;

            // Lấy userId
            const userId = await db.table.users.getId(token);

            let sql = 'select * from noted where usersid = ? and status = ? order by id desc';
            const result = await db.query(sql, [userId, 1]);

            if (result) {
                res.json({
                    success: true,
                    notedlist: result,
                    message: 'Lấy ra danh sách thành công'
                })
            } else {
                res.json({
                    success: false,
                    message: 'Lấy ra danh sách thất bại'
                })
            }
        } catch (e) {
            logger.error(e)
            res.json({
                success: false,
                message: 'Có lỗi khi lấy danh sách'
            })
        }
    },

    getContent: async (req, res) => {
        try {
            const { notedId } = req.query;

            let sql = 'select content from noted where id = ?';
            const result = await db.query(sql, notedId)

            if (result) {
                res.json({
                    success: true,
                    data: result,
                    message: 'Lấy ra nội dung thành công'
                })
            } else {
                res.json({
                    success: false,
                    message: 'Lấy ra nội dung thất bại'
                })
            }
        } catch (e) {
            logger.error(e)
            res.json({
                success: false,
                message: 'Có lỗi khi lấy ra nội dung'
            })
        }
    },

    searchNoted: async (req, res) => {
        try {
            const { token, searchKey } = req.query;

            const userId = await db.table.users.getId(token);

            let sql = 'select * from noted where usersid = ? and namelist like ? and status = ? order by id desc'

            const result = await db.query(sql, [userId, `%${searchKey}%`, 1]);

            if (result) {
                res.json({
                    success: true,
                    notedlist: result,
                    message: 'Lấy dữ liệu thành công'
                });
            } else {
                res.json({
                    success: false,
                    message: 'Lấy dữ liệu thất bại'
                })
            }
        } catch (e) {
            logger.error(e)
            res.json({
                success: false,
                message: 'Có lỗi khi lấy dữ liệu'
            })
        }
    },

    insertNoted: async (req, res) => {
        try {
            const { Token, NameList } = req.body;

            // Lấy ra userId từ token
            const UserId = await db.table.users.getId(Token);

            const AtCreate = new Date().toISOString();
            const Content = `<span>Chưa có nội dung được thêm vào</span>`;
            // Thực hiện truy vấn
            let sql = 'insert into noted (usersId, namelist, content, atcreate, atupdate, status) values (?, ?, ?, ?, ?, ?)';
            let params = [UserId, NameList, Content, AtCreate, AtCreate, 1]
            const result = await db.query(sql, params);

            if (result) {
                res.json({
                    success: true,
                    message: 'Thêm danh sách mới thành công'
                })
            } else {
                res.json({
                    success: false,
                    message: 'Thêm danh sách mới thất bại'
                })
            }
        } catch (e) {
            logger.error(e)
            res.json({
                success: false,
                message: 'Có lỗi khi thêm danh sách'
            })
        }
    },

    updateNoted: async (req, res) => {
        try {
            const { notedId, nameList, content } = req.body;

            let sql = 'update noted set namelist = ?, content = ? where id = ?';
            const result = await db.query(sql, [nameList, content, notedId])

            if (result) {
                res.json({
                    success: true,
                    message: 'Cập nhật nội dung thành công'
                })
            } else {
                res.json({
                    success: false,
                    message: 'Cập nhật nội dung thất bại'
                })
            }
        } catch (e) {
            logger.error(e)
            res.json({
                success: false,
                message: 'Có lỗi khi cập nhật nội dung'
            })
        }
    },

    deleteNoted: async (req, res) => {
        try {
            const { IdNoted } = req.body;

            let sql = 'update noted set status = 0 where id = ?';
            const result = await db.query(sql, [IdNoted]);
            if (result) {
                res.json({
                    success: true,
                    message: 'Đã xoá danh sách này thành công',
                })
            } else {
                res.json({
                    success: false,
                    message: "Xoá danh sách này thất bại",
                })
            }
        } catch (e) {
            logger.error(e)
            res.json({
                success: false,
                message: 'Có lỗi khi xoá danh sách này'
            })
        }
    },
}