
<h1 align="center">
  <br>
  <img src="https://github.com/ALR2310/SpendingManager/assets/87233160/e71d37fd-5c26-438b-9e8b-a46de90eaf39" width="200">
  <br>
  Spending Manager
  <br>
</h1>

<h4 align="center">Một ứng dụng quản lý chi tiêu cá nhân được xây với <a href="https://www.electronjs.org" target="_blank">Electron</a> và <a href="https://expressjs.com" target="_blank">Express</a>.</h4>

<p align="center">
  <a href="#tính-năng">Tính năng</a> •
  <a href="#tải-xuống">Tải xuống</a> •
  <a href="#tín-dụng">Tín dụng</a> •
  <a href="https://github.com/ALR2310/SpendingManager/issues/new">Báo lỗi</a> •
  <a href="#cách-sử-dụng">Cách sử dụng</a> •
  <a href="#giấy-phép">Giấy phép</a> •
  <a href="#phản-hồi-và-đóng-góp">Phản hồi</a>
</p>

![images](https://github.com/ALR2310/SpendingManager/assets/87233160/d39a94e8-35d6-4180-a86b-4c8e2e7634c6)

SpendingManager là một dự án cá nhân do tôi phát triển, là ứng dụng quản lý chi tiêu tích hợp trên nền tảng Node.js sử dụng đồng thời ElectronJS và Express để xây dựng. Dự án này bắt nguồn từ nhu cầu cá nhân về việc hiệu quả hóa quá trình theo dõi, thống kê, ghi chú và quản lý các chi tiêu hàng ngày.

## Tính năng
1. **Quản lý Danh Sách Chi Tiêu:**
   - Tạo và quản lý danh sách chi tiêu để phân loại mục chi tiêu một cách rõ ràng và tiện lợi.
2. **Thêm, Xoá, Sửa Chi Tiêu và Danh Sách:**
   - Thêm, xoá, và sửa thông tin chi tiêu cũng như danh sách một cách dễ dàng để duy trì dữ liệu chính xác.
3. **Tìm Kiếm Và lọc Chi Tiêu:**
   - Tìm kiếm nhanh chóng thông qua chức năng tìm kiếm tích hợp, giúp người dùng dễ dàng định vị và xem lại các chi tiêu cụ thể.
4. **Chức Năng Thống Kê:**
   - Cung cấp các báo cáo và biểu đồ thống kê để phân tích xu hướng chi tiêu và hiểu rõ hơn về tình hình tài chính cá nhân.
5. **Xuất Dữ Liệu:**
   - Hỗ trợ xuất dữ liệu chi tiêu sang định dạng Excel và PDF để người dùng có thể lưu trữ và chia sẻ thông tin một cách thuận tiện.
6. **Sao Lưu/Dồng Bộ Dữ Liệu bằng Google Drive:**
   - Cho phép người dùng sao lưu và đồng bộ dữ liệu với Google Drive, giúp bảo vệ dữ liệu và tiện ích khi sử dụng ứng dụng trên nhiều thiết bị.

## Tải xuống
Bạn có thể tải xuống phiên bản ứng dụng mới nhất cho window [tại đây](https://github.com/ALR2310/SpendingManager/releases/latest).

## Tín dụng

Ứng dụng này sử dụng các gói và thư viện sau:

- [![Electron Badge](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=fff&style=for-the-badge)](https://www.electronjs.org/)
- [![Express Badge](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff&style=for-the-badge)](https://expressjs.com)
- [![Node.js Badge](https://img.shields.io/badge/Node.js-393?logo=nodedotjs&logoColor=fff&style=for-the-badge)](https://nodejs.org)
- [![Bootstrap Badge](https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=fff&style=for-the-badge)](https://getbootstrap.com)
- [![CKEditor 4 Badge](https://img.shields.io/badge/CKEditor%204-0287D0?logo=ckeditor4&logoColor=fff&style=for-the-badge)](https://ckeditor.com)
- [![Apache ECharts Badge](https://img.shields.io/badge/Apache%20ECharts-AA344D?logo=apacheecharts&logoColor=fff&style=for-the-badge)](https://echarts.apache.org)
- [![Font Awesome Badge](https://img.shields.io/badge/Font%20Awesome-528DD7?logo=fontawesome&logoColor=fff&style=for-the-badge)](https://fontawesome.com)
- [![jQuery Badge](https://img.shields.io/badge/jQuery-0769AD?logo=jquery&logoColor=fff&style=for-the-badge)](https://jquery.com)
- [![Lodash Badge](https://img.shields.io/badge/Lodash-3492FF?logo=lodash&logoColor=fff&style=for-the-badge)](https://lodash.com)
- [![Handlebars.js Badge](https://img.shields.io/badge/Handlebars.js-f0772b?logo=handlebarsdotjs&logoColor=fff&style=for-the-badge)](https://handlebarsjs.com)

## Cách sử dụng

Để sao chép và chạy ứng dụng này, bạn sẽ cần cài đặt [Git](https://git-scm.com) và [Node.js](https://nodejs.org) trên máy tính. 

```bash
# Sao chép kho lưu trữ này
$ git clone https://github.com/ALR2310/SpendingManager

# Mở kho lưu trữ
$ cd SpendingManager

# Cài đặt các phần phụ thuộc
$ npm install

# Chạy ứng dụng
$ npm run wd

# Hoặc
$ npm run watch

# Đóng gói ứng dụng
$ npm run package
```

_Lưu ý_: bạn sẽ cần phải tạo một tệp `.env` với các biến môi trường để ứng dụng có thể hoạt động, ví dụ như sau:

```bash
#App
HOST=localhost
PORT=3962
#Session Secret
SESSION_SECRET=spendingmanager
#Google Login
GOOGLE_CLIENT_ID=Client-Id-của-bạn
GOOGLE_CLIENT_SECRET=Client-Secret-của-bạn
GOOGLE_CALLBACK_URL=http://localhost:3962/auth/loginGoogle/callback
#Facebook Login
FACEBOOK_CLIENT_ID=Client-Id-của-bạn
FACEBOOK_CLIENT_SECRET=Client-Secret-của-bạn
FACEBOOK_CALLBACK_URL=http://localhost:3962/auth/loginFacebook/callback
# GG Drive API
GG_DRIVE_CLIENT_ID=Client-Id-của-bạn
GG_DRIVE_CLIENT_SECRET=Client-Secret-của-bạn
GG_DRIVE_REDIRECT_URI=http://localhost:3962/auth/loginGGDrive/callback
KEY_ENCRYPT_REFRESH_TOKEN=01234567890123456789012345678901
# OpenWeather
WEATHER_API=fea7580e5581c524e51e4f532e3121d4
# CoinMarket
COINMARKET_API=019b37f1-b884-443c-884d-d93e2cbc00ed
```

## Giấy phép

Được phân phối theo Giấy phép MIT. Xem `LICENSE.txt` để biết thêm thông tin.

## Phản Hồi và Đóng Góp

SpendingManager là một dự án cá nhân rất mong được đón nhận phản hồi từ cộng đồng người dùng. Nếu bạn có ý kiến hoặc đề xuất, hãy tạo issue trên GitHub để chúng ta có thể cùng nhau phát triển ứng dụng tốt hơn.

