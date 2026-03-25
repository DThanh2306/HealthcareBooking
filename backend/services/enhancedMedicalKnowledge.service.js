// Enhanced Medical Knowledge Base Service với độ chính xác cao hơn
const advancedFuzzyVector = require('./advancedFuzzyVector.service');
const crossMappingService = require('./crossMappingService.service');
const locationBasedRecommendation = require('./locationBasedRecommendation.service');

class EnhancedMedicalKnowledgeService {
  constructor() {
    // Mở rộng bản đồ triệu chứng với nhiều biến thể và từ đồng nghĩa
    this.symptomSpecialtyMap = new Map([
      // Tim mạch - mở rộng với nhiều biến thể
      ['đau ngực', ['Tim mạch', 'Nội khoa', 'Cấp cứu']],
      ['tức ngực', ['Tim mạch', 'Nội khoa']],
      ['bóp nghẹt ngực', ['Tim mạch', 'Cấp cứu']],
      ['khó thở', ['Tim mạch', 'Hô hấp', 'Nội khoa']],
      ['hụt hơi', ['Tim mạch', 'Hô hấp']],
      ['thở gấp', ['Tim mạch', 'Hô hấp', 'Cấp cứu']],
      ['đánh trống ngực', ['Tim mạch', 'Nội khoa']],
      ['tim đập nhanh', ['Tim mạch', 'Nội khoa']],
      ['tim đập mạnh', ['Tim mạch', 'Nội khoa']],
      ['huyết áp cao', ['Tim mạch', 'Nội khoa']],
      ['cao huyết áp', ['Tim mạch', 'Nội khoa']],
      ['huyết áp thấp', ['Tim mạch', 'Nội khoa']],
      ['phù chân', ['Tim mạch', 'Thận - Tiết niệu', 'Nội khoa']],
      ['sưng chân', ['Tim mạch', 'Thận - Tiết niệu']],
      ['mệt mỏi tim', ['Tim mạch', 'Nội khoa']],
      ['ngất', ['Tim mạch', 'Thần kinh', 'Cấp cứu']],
      ['chóng mặt tim', ['Tim mạch', 'Thần kinh']],

      // Hô hấp - chi tiết hơn
      ['ho', ['Hô hấp', 'Tai Mũi Họng', 'Nội khoa']],
      ['ho khan', ['Hô hấp', 'Tai Mũi Họng']],
      ['ho có đờm', ['Hô hấp', 'Nội khoa']],
      ['ho ra máu', ['Hô hấp', 'Nội khoa', 'Cấp cứu']],
      ['khạc máu', ['Hô hấp', 'Cấp cứu']],
      ['khạc ra máu', ['Hô hấp', 'Cấp cứu']],
      ['viêm phổi', ['Hô hấp', 'Nội khoa']],
      ['nhiễm trùng phổi', ['Hô hấp', 'Nội khoa']],
      ['hen suyễn', ['Hô hấp', 'Dị ứng - Miễn dịch']],
      ['hen phế quản', ['Hô hấp', 'Dị ứng - Miễn dịch']],
      ['khò khè', ['Hô hấp', 'Nội khoa']],
      ['thở khó khăn', ['Hô hấp', 'Tim mạch']],
      ['ngạt thở', ['Hô hấp', 'Cấp cứu']],
      ['nghẹt thở', ['Hô hấp', 'Cấp cứu']],
      ['viêm họng', ['Tai Mũi Họng', 'Nội khoa']],
      ['đau họng', ['Tai Mũi Họng']],
      ['viêm phế quản', ['Hô hấp', 'Nội khoa']],
      ['lao phổi', ['Hô hấp', 'Lao và Bệnh phổi']],
      ['lao', ['Lao và Bệnh phổi', 'Hô hấp']],

      // Tiêu hóa - mở rộng
      ['đau bụng', ['Tiêu hóa', 'Nội khoa', 'Ngoại khoa']],
      ['đau dạ dày', ['Tiêu hóa', 'Nội khoa']],
      ['đau ruột', ['Tiêu hóa', 'Ngoại khoa']],
      ['viêm ruột thừa', ['Ngoại khoa', 'Cấp cứu']],
      ['ruột thừa', ['Ngoại khoa', 'Cấp cứu']],
      ['nôn mửa', ['Tiêu hóa', 'Nội khoa', 'Thần kinh']],
      ['buồn nôn', ['Tiêu hóa', 'Nội khoa']],
      ['nôn ra máu', ['Tiêu hóa', 'Cấp cứu']],
      ['tiêu chảy', ['Tiêu hóa', 'Nội khoa', 'Truyền nhiễm']],
      ['đi lỏng', ['Tiêu hóa', 'Nội khoa']],
      ['táo bón', ['Tiêu hóa', 'Nội khoa']],
      ['khó đi ngoài', ['Tiêu hóa', 'Nội khoa']],
      ['đầy hơi', ['Tiêu hóa', 'Nội khoa']],
      ['chướng bụng', ['Tiêu hóa', 'Nội khoa']],
      ['ợ hơi', ['Tiêu hóa', 'Nội khoa']],
      ['ợ chua', ['Tiêu hóa', 'Nội khoa']],
      ['trào ngược', ['Tiêu hóa', 'Nội khoa']],
      ['phân máu', ['Tiêu hóa', 'Cấp cứu']],
      ['đi ngoài ra máu', ['Tiêu hóa', 'Cấp cứu']],
      ['phân đen', ['Tiêu hóa', 'Cấp cứu']],
      ['xuất huyết tiêu hóa', ['Tiêu hóa', 'Cấp cứu']],

      // Thần kinh - chi tiết
      ['đau đầu', ['Thần kinh', 'Nội khoa']],
      ['nhức đầu', ['Thần kinh', 'Nội khoa']],
      ['đau nửa đầu', ['Thần kinh']],
      ['migraine', ['Thần kinh']],
      ['chóng mặt', ['Thần kinh', 'Tai Mũi Họng', 'Tim mạch']],
      ['hoa mắt', ['Thần kinh', 'Mắt']],
      ['co giật', ['Thần kinh', 'Cấp cứu']],
      ['động kinh', ['Thần kinh']],
      ['liệt', ['Thần kinh', 'Cấp cứu']],
      ['yếu liệt', ['Thần kinh', 'Cấp cứu']],
      ['tê bì', ['Thần kinh', 'Cơ Xương Khớp']],
      ['mất cảm giác', ['Thần kinh']],
      ['rung giật', ['Thần kinh', 'Nội khoa']],
      ['run tay', ['Thần kinh', 'Nội khoa']],
      ['mất trí nhớ', ['Thần kinh', 'Lão khoa']],
      ['quên', ['Thần kinh', 'Tâm thần']],
      ['mất ngủ', ['Thần kinh', 'Tâm thần']],
      ['khó ngủ', ['Thần kinh', 'Tâm thần']],
      ['đột quỵ', ['Thần kinh', 'Cấp cứu']],
      ['tai biến', ['Thần kinh', 'Cấp cứu']],

      // Cơ Xương Khớp - mở rộng
      ['đau lưng', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau cột sống', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau vai gáy', ['Cơ Xương Khớp']],
      ['đau cổ', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau khớp', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['viêm khớp', ['Thấp khớp', 'Cơ Xương Khớp']],
      ['thoái hóa khớp', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['khớp cứng', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['sưng khớp', ['Thấp khớp', 'Cơ Xương Khớp']],
      ['đau cơ', ['Cơ Xương Khớp', 'Thần kinh']],
      ['căng cơ', ['Cơ Xương Khớp', 'Phục hồi chức năng']],
      ['yếu cơ', ['Thần kinh', 'Cơ Xương Khớp']],
      ['gãy xương', ['Cơ Xương Khớp', 'Ngoại khoa', 'Cấp cứu']],
      ['nứt xương', ['Cơ Xương Khớp', 'Ngoại khoa']],
      ['bong gân', ['Cơ Xương Khớp', 'Phục hồi chức năng']],

      // Da liễu - chi tiết
      ['ngứa', ['Da liễu']],
      ['ngứa da', ['Da liễu']],
      ['nổi mẩn', ['Da liễu', 'Dị ứng - Miễn dịch']],
      ['mẩn đỏ', ['Da liễu', 'Dị ứng - Miễn dịch']],
      ['viêm da', ['Da liễu']],
      ['dị ứng da', ['Da liễu', 'Dị ứng - Miễn dịch']],
      ['chàm', ['Da liễu']],
      ['eczema', ['Da liễu']],
      ['mụn', ['Da liễu']],
      ['mụn trứng cá', ['Da liễu']],
      ['nám', ['Da liễu']],
      ['tàn nhang', ['Da liễu']],
      ['zona', ['Da liễu', 'Thần kinh']],
      ['herpes', ['Da liễu', 'Truyền nhiễm']],

      // Sản Phụ khoa - mở rộng
      ['rối loạn kinh nguyệt', ['Sản Phụ khoa']],
      ['kinh nguyệt không đều', ['Sản Phụ khoa']],
      ['đau bụng kinh', ['Sản Phụ khoa']],
      ['đau khi có kinh', ['Sản Phụ khoa']],
      ['khí hư bất thường', ['Sản Phụ khoa']],
      ['ra khí hư nhiều', ['Sản Phụ khoa']],
      ['viêm âm đạo', ['Sản Phụ khoa']],
      ['ngứa vùng kín', ['Sản Phụ khoa']],
      ['u xơ tử cung', ['Sản Phụ khoa']],
      ['buồng trứng', ['Sản Phụ khoa']],
      ['mãn kinh', ['Sản Phụ khoa', 'Nội tiết']],
      ['tiền mãn kinh', ['Sản Phụ khoa', 'Nội tiết']],

      // Niệu khoa - mở rộng
      ['đau khi tiểu tiện', ['Niệu khoa', 'Nội khoa']],
      ['tiểu buốt', ['Niệu khoa', 'Nội khoa']],
      ['tiểu rắt', ['Niệu khoa', 'Nội khoa']],
      ['tiểu khó', ['Niệu khoa', 'Nội khoa']],
      ['tiểu gấp', ['Niệu khoa', 'Nội khoa']],
      ['tiểu đêm', ['Niệu khoa', 'Nội khoa']],
      ['tiểu ra máu', ['Niệu khoa', 'Cấp cứu']],
      ['nước tiểu có máu', ['Niệu khoa', 'Cấp cứu']],
      ['sỏi thận', ['Niệu khoa']],
      ['sỏi tiết niệu', ['Niệu khoa']],
      ['viêm đường tiết niệu', ['Niệu khoa', 'Nội khoa']],
      ['viêm bàng quang', ['Niệu khoa', 'Nội khoa']],
      ['viêm thận', ['Niệu khoa', 'Nội khoa']],

      // Tai Mũi Họng - chi tiết
      ['đau họng', ['Tai Mũi Họng']],
      ['viêm họng', ['Tai Mũi Họng', 'Nội khoa']],
      ['viêm amidan', ['Tai Mũi Họng']],
      ['amidan to', ['Tai Mũi Họng']],
      ['nghẹt mũi', ['Tai Mũi Họng']],
      ['sổ mũi', ['Tai Mũi Họng']],
      ['viêm mũi dị ứng', ['Tai Mũi Họng', 'Dị ứng - Miễn dịch']],
      ['viêm xoang', ['Tai Mũi Họng']],
      ['ù tai', ['Tai Mũi Họng']],
      ['đau tai', ['Tai Mũi Họng']],
      ['viêm tai', ['Tai Mũi Họng']],
      ['chảy máu cam', ['Tai Mũi Họng', 'Huyết học']],
      ['khàn tiếng', ['Tai Mũi Họng']],
      ['mất tiếng', ['Tai Mũi Họng']],

      // Mắt - chi tiết
      ['đau mắt', ['Mắt']],
      ['mờ mắt', ['Mắt', 'Thần kinh']],
      ['nhìn mờ', ['Mắt', 'Thần kinh']],
      ['khô mắt', ['Mắt']],
      ['đỏ mắt', ['Mắt']],
      ['viêm kết mạc', ['Mắt']],
      ['đau mắt đỏ', ['Mắt', 'Truyền nhiễm']],
      ['tăng nhãn áp', ['Mắt']],
      ['glaucoma', ['Mắt']],
      ['cận thị', ['Mắt']],
      ['viễn thị', ['Mắt']],
      ['loạn thị', ['Mắt']],
      ['võng mạc', ['Mắt']],

      // Tâm thần - mở rộng
      ['trầm cảm', ['Tâm thần']],
      ['buồn chán', ['Tâm thần']],
      ['lo âu', ['Tâm thần']],
      ['lo lắng', ['Tâm thần']],
      ['căng thẳng', ['Tâm thần', 'Nội khoa']],
      ['stress', ['Tâm thần', 'Nội khoa']],
      ['hoảng loạn', ['Tâm thần']],
      ['rối loạn tâm thần', ['Tâm thần']],
      ['tâm thần phân liệt', ['Tâm thần']],
      ['lưỡng cực', ['Tâm thần']],

      // Nội tiết - chi tiết
      ['tiểu đường', ['Nội tiết', 'Nội khoa']],
      ['đái tháo đường', ['Nội tiết', 'Nội khoa']],
      ['đường huyết cao', ['Nội tiết', 'Nội khoa']],
      ['tăng cân', ['Nội tiết', 'Dinh dưỡng']],
      ['béo phì', ['Nội tiết', 'Dinh dưỡng']],
      ['sụt cân', ['Nội tiết', 'Nội khoa', 'Ung bướu']],
      ['giảm cân', ['Nội tiết', 'Dinh dưỡng']],
      ['tuyến giáp', ['Nội tiết']],
      ['cường giáp', ['Nội tiết']],
      ['suy giáp', ['Nội tiết']],
      ['rối loạn nội tiết', ['Nội tiết']],

      // Nhi khoa - đặc trưng trẻ em
      ['sốt ở trẻ', ['Nhi khoa', 'Cấp cứu']],
      ['co giật ở trẻ', ['Nhi khoa', 'Cấp cứu']],
      ['tiêu chảy ở trẻ', ['Nhi khoa']],
      ['ho ở trẻ', ['Nhi khoa']],
      ['khó thở ở trẻ', ['Nhi khoa', 'Cấp cứu']],
      ['chậm phát triển', ['Nhi khoa']],
      ['tăng trưởng chậm', ['Nhi khoa']],
      ['biếng ăn ở trẻ', ['Nhi khoa']],

      // Chân - Bàn Chân
      ['đau chân', ['Cơ Xương Khớp', 'Tim mạch', 'Nội tiết']],
      ['sưng chân', ['Tim mạch', 'Thận - Tiết niệu', 'Cơ Xương Khớp']],
      ['tê chân', ['Thần kinh', 'Nội tiết', 'Cơ Xương Khớp']],
      ['chuột rút', ['Cơ Xương Khớp', 'Nội tiết']],
      ['gù chân', ['Cơ Xương Khớp', 'Phẫu thuật chỉnh hình']],
      ['đau bàn chân', ['Cơ Xương Khớp', 'Phục hồi chức năng']],
      ['nứt gót chân', ['Da liễu', 'Cơ Xương Khớp']],
      ['móng chân', ['Da liễu', 'Ngoại khoa']],
      ['nấm chân', ['Da liễu']],
      ['chai chân', ['Da liễu', 'Cơ Xương Khớp']],
      ['đau gót chân', ['Cơ Xương Khớp', 'Phục hồi chức năng']],
      ['viêm gân chân', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['gãy chân', ['Cơ Xương Khớp', 'Ngoại khoa', 'Cấp cứu']],
      ['bong gân chân', ['Cơ Xương Khớp', 'Phục hồi chức năng']],
      ['nhiễm trùng chân', ['Da liễu', 'Nội khoa']],
      ['loét chân', ['Da liễu', 'Nội tiết', 'Tim mạch']],
      ['tĩnh mạch chân', ['Tim mạch', 'Phẫu thuật mạch máu']],
      ['suy giãn tĩnh mạch', ['Tim mạch', 'Phẫu thuật mạch máu']],
      ['phù chân', ['Tim mạch', 'Thận - Tiết niệu', 'Nội khoa']],
      ['lạnh chân', ['Tim mạch', 'Nội tiết']],
      ['tê bì chân', ['Thần kinh', 'Nội tiết']],
      ['yếu chân', ['Thần kinh', 'Cơ Xương Khớp']],
      ['khó đi', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau cơ chân', ['Cơ Xương Khớp', 'Thần kinh']],
      ['cứng khớp chân', ['Thấp khớp', 'Cơ Xương Khớp']],
      ['biến dạng chân', ['Cơ Xương Khớp', 'Phẫu thuật chỉnh hình']],
      ['thần kinh chân', ['Thần kinh', 'Nội tiết']],

      // Tay - Cánh Tay  
      ['đau tay', ['Cơ Xương Khớp', 'Thần kinh']],
      ['tê tay', ['Thần kinh', 'Cơ Xương Khớp']],
      ['cứng tay', ['Thấp khớp', 'Thần kinh']],
      ['rung tay', ['Thần kinh', 'Nội tiết']],
      ['yếu tay', ['Thần kinh', 'Cơ Xương Khớp']],
      ['đau cánh tay', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau cổ tay', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau khuỷu tay', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['đau vai', ['Cơ Xương Khớp', 'Thần kinh']],
      ['hội chứng ống cổ tay', ['Thần kinh', 'Cơ Xương Khớp']],
      ['viêm gân tay', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['bong gân tay', ['Cơ Xương Khớp', 'Phục hồi chức năng']],
      ['gãy tay', ['Cơ Xương Khớp', 'Ngoại khoa', 'Cấp cứu']],
      ['bầm tím tay', ['Cấp cứu', 'Cơ Xương Khớp']],
      ['sưng tay', ['Cơ Xương Khớp', 'Da liễu']],
      ['khó cầm nắm', ['Thần kinh', 'Cơ Xương Khớp']],
      ['tê ngón tay', ['Thần kinh', 'Tim mạch']],
      ['cứng khớp ngón', ['Thấp khớp', 'Cơ Xương Khớp']],
      ['viêm khớp tay', ['Thấp khớp', 'Cơ Xương Khớp']],
      ['chấn thương tay', ['Cấp cứu', 'Cơ Xương Khớp']],
      ['cắt tay', ['Cấp cứu', 'Ngoại khoa']],
      ['bỏng tay', ['Cấp cứu', 'Da liễu']],
      ['dị ứng tay', ['Da liễu', 'Dị ứng - Miễn dịch']],
      ['run tay', ['Thần kinh', 'Nội tiết']],
      ['co cứng tay', ['Thần kinh', 'Cơ Xương Khớp']],
      ['mất lực tay', ['Thần kinh', 'Cơ Xương Khớp']],
      ['đau thần kinh tay', ['Thần kinh']],

      // Mắt - Thị Giác (mở rộng)
      ['lóa mắt', ['Mắt', 'Thần kinh']],
      ['mù màu', ['Mắt']],
      ['lác mắt', ['Mắt', 'Thần kinh']],
      ['cườm mắt', ['Mắt']],
      ['tăng nhãn áp', ['Mắt']],
      ['đục thủy tinh thể', ['Mắt']],
      ['điểm đen mắt', ['Mắt', 'Thần kinh']],
      ['nhấp nháy mắt', ['Mắt', 'Thần kinh']],
      ['sụp mi', ['Mắt', 'Thần kinh']],
      ['mắt lồi', ['Mắt', 'Nội tiết']],
      ['mắt cận', ['Mắt']],
      ['mắt viễn', ['Mắt']],
      ['quầng thâm mắt', ['Mắt', 'Da liễu']],
      ['bong võng mạc', ['Mắt', 'Cấp cứu']],
      ['xuất huyết mắt', ['Mắt', 'Cấp cứu']],
      ['mắt lé', ['Mắt']],

      // Tai - Thính Giác (mở rộng)
      ['nghe kém', ['Tai Mũi Họng']],
      ['chảy tai', ['Tai Mũi Họng']],
      ['ngứa tai', ['Tai Mũi Họng', 'Da liễu']],
      ['ráy tai', ['Tai Mũi Họng']],
      ['chóng mặt tai', ['Tai Mũi Họng', 'Thần kinh']],
      ['mất thăng bằng', ['Tai Mũi Họng', 'Thần kinh']],
      ['tiếng vo ve', ['Tai Mũi Họng']],
      ['tai bị tắc', ['Tai Mũi Họng']],
      ['sưng tai', ['Tai Mũi Họng', 'Da liễu']],
      ['nhiễm trùng tai', ['Tai Mũi Họng']],
      ['thủng màng nhĩ', ['Tai Mũi Họng', 'Cấp cứu']],
      ['điếc đột ngột', ['Tai Mũi Họng', 'Cấp cứu']],
      ['chuông tai', ['Tai Mũi Họng']],
      ['rung tai', ['Tai Mũi Họng']],
      ['đau sâu trong tai', ['Tai Mũi Họng']],
      ['nóng tai', ['Tai Mũi Họng']],
      ['tai chảy mủ', ['Tai Mũi Họng']],
      ['nghe có tiếng kêu', ['Tai Mũi Họng']],

      // Cổ - Vai - Gáy (mở rộng)
      ['cứng cổ', ['Cơ Xương Khớp', 'Thần kinh', 'Truyền nhiễm']],
      ['đau gáy', ['Cơ Xương Khớp', 'Thần kinh']],
      ['vai gáy', ['Cơ Xương Khớp']],
      ['đau mỏi vai gáy', ['Cơ Xương Khớp']],
      ['cứng gáy', ['Thần kinh', 'Truyền nhiễm', 'Cấp cứu']],
      ['kẹt cổ', ['Cơ Xương Khớp']],
      ['vẹo cổ', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau lan xuống tay', ['Thần kinh', 'Cơ Xương Khớp']],
      ['tê tay từ cổ', ['Thần kinh']],
      ['đau thần kinh cổ', ['Thần kinh']],
      ['u cổ', ['Ngoại khoa', 'Nội tiết', 'Ung bướu']],
      ['hạch cổ', ['Nội khoa', 'Truyền nhiễm']],
      ['sưng cổ', ['Nội tiết', 'Tai Mũi Họng']],
      ['khó nuốt', ['Tai Mũi Họng', 'Nội tiết']],
      ['khàn tiếng', ['Tai Mũi Họng']],
      ['tuyến giáp', ['Nội tiết']],
      ['căng cơ cổ', ['Cơ Xương Khớp']],
      ['spasm cổ', ['Cơ Xương Khớp', 'Thần kinh']],
      ['va đập cổ', ['Cấp cứu', 'Cơ Xương Khớp']],
      ['đau sau gáy', ['Cơ Xương Khớp', 'Thần kinh']],
      ['nhức mỏi vai', ['Cơ Xương Khớp']],
      ['vai đông cứng', ['Cơ Xương Khớp', 'Thấp khớp']],

      // Ngực - Lồng Ngực (mở rộng)
      ['tức ngực', ['Tim mạch', 'Hô hấp']],
      ['bóp nghẹt ngực', ['Tim mạch', 'Cấp cứu']],
      ['đau thành ngực', ['Cơ Xương Khớp', 'Hô hấp']],
      ['thở gấp', ['Tim mạch', 'Hô hấp', 'Cấp cứu']],
      ['thở khò khè', ['Hô hấp', 'Dị ứng - Miễn dịch']],
      ['ngạt thở', ['Cấp cứu', 'Hô hấp']],
      ['ho có máu', ['Hô hấp', 'Cấp cứu']],
      ['ho khan', ['Hô hấp', 'Tai Mũi Họng']],
      ['đờm', ['Hô hấp']],
      ['viêm phổi', ['Hô hấp', 'Nội khoa']],
      ['tim đập nhanh', ['Tim mạch', 'Nội tiết']],
      ['hụt hơi', ['Tim mạch', 'Hô hấp']],
      ['mệt khi gắng sức', ['Tim mạch']],
      ['đau sườn', ['Cơ Xương Khớp']],
      ['gãy sườn', ['Cơ Xương Khớp', 'Cấp cứu']],
      ['bầm ngực', ['Cấp cứu', 'Cơ Xương Khớp']],
      ['thở đau', ['Hô hấp', 'Cơ Xương Khớp']],
      ['cảm giác nặng ngực', ['Tim mạch', 'Hô hấp']],
      ['co thắt ngực', ['Tim mạch']],
      ['đau dưới xương ức', ['Tim mạch', 'Tiêu hóa']],

      // Lưng - Cột Sống (mở rộng)
      ['đau cột sống', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau lưng dưới', ['Cơ Xương Khớp', 'Thận - Tiết niệu']],
      ['đau lưng trên', ['Cơ Xương Khớp']],
      ['đau lan xuống chân', ['Thần kinh', 'Cơ Xương Khớp']],
      ['tê chân từ lưng', ['Thần kinh']],
      ['yếu chân từ lưng', ['Thần kinh']],
      ['khó đi do lưng', ['Cơ Xương Khớp', 'Thần kinh']],
      ['cứng lưng', ['Cơ Xương Khớp']],
      ['spasm lưng', ['Cơ Xương Khớp']],
      ['lưng cong', ['Cơ Xương Khớp']],
      ['vẹo cột sống', ['Cơ Xương Khớp', 'Phẫu thuật chỉnh hình']],
      ['thoát vị đĩa đệm', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau dây thần kinh', ['Thần kinh']],
      ['đau toạ', ['Thần kinh', 'Cơ Xương Khớp']],
      ['đau cơ lưng', ['Cơ Xương Khớp']],
      ['khó cử động lưng', ['Cơ Xương Khớp']],
      ['không thể cúi xuống', ['Cơ Xương Khớp']],
      ['đau khi ho hắt hơi', ['Cơ Xương Khớp', 'Thần kinh']],
      ['đau buổi sáng', ['Cơ Xương Khớp', 'Thấp khớp']],
      ['đau khi đứng dậy', ['Cơ Xương Khớp']],
      ['mỏi lưng', ['Cơ Xương Khớp']],

      // Da - Tóc - Móng (mở rộng)
      ['nổi mẩn', ['Da liễu', 'Dị ứng - Miễn dịch']],
      ['mụn trứng cá', ['Da liễu']],
      ['chàm', ['Da liễu', 'Dị ứng - Miễn dịch']],
      ['eczema', ['Da liễu', 'Dị ứng - Miễn dịch']],
      ['nấm da', ['Da liễu']],
      ['bệnh nấm', ['Da liễu']],
      ['lang ben', ['Da liễu']],
      ['vảy nến', ['Da liễu']],
      ['tàn nhang', ['Da liễu']],
      ['đốm nâu', ['Da liễu']],
      ['ung thư da', ['Da liễu', 'Ung bướu']],
      ['u da', ['Da liễu', 'Ngoại khoa']],
      ['rụng tóc', ['Da liễu', 'Nội tiết']],
      ['hói đầu', ['Da liễu']],
      ['gàu', ['Da liễu']],
      ['ngứa da đầu', ['Da liễu']],
      ['viêm da đầu', ['Da liễu']],
      ['móng tay', ['Da liễu', 'Ngoại khoa']],
      ['nấm móng', ['Da liễu']],
      ['móng vàng', ['Da liễu', 'Nội khoa']],
      ['móng bị gãy', ['Cấp cứu', 'Da liễu']],
      ['phỏng', ['Cấp cứu', 'Da liễu']],
      ['bỏng', ['Cấp cứu', 'Da liễu']],
      ['cắt', ['Cấp cứu', 'Ngoại khoa']],
      ['trầy xước', ['Cấp cứu', 'Da liễu']],
      ['nhiễm trùng da', ['Da liễu']],
      ['mụn nhọt', ['Da liễu']],
      ['áp xe', ['Da liễu', 'Ngoại khoa']],
      ['cellulitis', ['Da liễu', 'Nội khoa']],
      ['herpes', ['Da liễu', 'Truyền nhiễm']],
      ['zona', ['Da liễu', 'Thần kinh']],

      // Cấp cứu - triệu chứng nguy hiểm
      ['sốt cao', ['Cấp cứu', 'Nội khoa', 'Truyền nhiễm']],
      ['sốt trên 39 độ', ['Cấp cứu', 'Nội khoa']],
      ['ngất xíu', ['Cấp cứu', 'Tim mạch', 'Thần kinh']],
      ['bất tỉnh', ['Cấp cứu', 'Thần kinh']],
      ['khó thở dữ dội', ['Cấp cứu', 'Hô hấp', 'Tim mạch']],
      ['đau ngực dữ dội', ['Cấp cứu', 'Tim mạch']],
      ['chảy máu không cầm', ['Cấp cứu', 'Ngoại khoa']],
      ['xuất huyết', ['Cấp cứu', 'Huyết học']],
      ['đau bụng dữ dội', ['Cấp cứu', 'Ngoại khoa', 'Tiêu hóa']],
      ['cấp cứu', ['Cấp cứu']],
    ]);

    // Mức độ khẩn cấp với nhiều từ khóa hơn và scoring
    this.urgencyKeywords = new Map([
      ['khẩn cấp', [
        'sốt cao trên 40', 'khó thở dữ dội', 'đau ngực dữ dội', 'ngất xíu', 'bất tỉnh',
        'co giật', 'liệt', 'chảy máu không cầm', 'đau bụng dữ dội', 'nôn ra máu',
        'ho ra máu nhiều', 'đột quỵ', 'tai biến', 'nhồi máu cơ tim', 'sốc',
        'khó thở khi nghỉ ngơi', 'đau ngực lan ra tay', 'yếu liệt nửa người',
        'nói khó', 'méo miệng', 'mất ý thức', 'da tím tái', 'điếc đột ngột',
        'mất thị lực đột ngột', 'biến dạng rõ ràng', 'gãy hở', 'bỏng nặng'
      ]],
      ['cần khám sớm', [
        'sốt trên 38.5', 'đau đầu dữ dội', 'nôn mửa liên tục', 'đau bụng kéo dài',
        'tiêu chảy nhiều ngày', 'ho kéo dài', 'sụt cân nhanh', 'mệt mỏi nhiều',
        'đau khớp sưng', 'phù chân đột ngột', 'tim đập nhanh', 'huyết áp cao',
        'đau lưng lan xuống chân', 'tê bì kéo dài', 'chóng mặt thường xuyên',
        'nhiễm trùng', 'viêm', 'đau không giảm', 'sưng đỏ', 'run rẩy',
        'tiểu đường', 'cao tuổi', 'thay đổi nốt ruồi', 'chảy mủ'
      ]],
      ['cần theo dõi', [
        'ho nhẹ', 'sốt nhẹ', 'đau đầu nhẹ', 'mệt mỏi nhẹ', 'khó tiêu nhẹ',
        'táo bón nhẹ', 'đau khớp nhẹ', 'nghẹt mũi nhẹ', 'đau họng nhẹ',
        'khô mắt', 'mỏi mắt', 'mãn tính', 'ổn định', 'không đổi',
        'nhẹ', 'từ từ', 'chậm', 'định kỳ', 'thường xuyên nhưng nhẹ'
      ]]
    ]);

    // Thêm từ khóa routine symptoms để nhận diện chính xác
    this.routineIndicators = [
      'nhẹ', 'mãn tính', 'thường xuyên', 'ổn định', 'không đổi',
      'từ từ', 'chậm', 'định kỳ', 'khi làm việc', 'khi ngồi lâu',
      'buổi sáng', 'cuối ngày', 'stress', 'mệt mỏi do làm việc',
      'do thời tiết', 'theo mùa', 'khi thay đổi tư thế'
    ];

    // Phân tích theo độ tuổi chi tiết hơn
    this.ageSpecialtyMap = new Map([
      ['0-1', ['Nhi khoa', 'Sơ sinh']],
      ['1-15', ['Nhi khoa']],
      ['16-25', ['Y học gia đình', 'Nội khoa']],
      ['26-65', ['Nội khoa', 'Y học gia đình']],
      ['66-80', ['Lão khoa', 'Tim mạch', 'Nội khoa']],
      ['80+', ['Lão khoa', 'Tim mạch', 'Thần kinh']]
    ]);

    // Phân tích theo giới tính chi tiết
    this.genderSpecialtyMap = new Map([
      ['nữ', {
        general: ['Sản Phụ khoa', 'Nội tiết'],
        reproductive_age: ['Sản Phụ khoa', 'Nội tiết', 'Vú'],
        menopause: ['Sản Phụ khoa', 'Nội tiết', 'Tim mạch']
      }],
      ['nam', {
        general: ['Nam khoa'],
        elderly: ['Nam khoa', 'Niệu khoa', 'Tim mạch']
      }]
    ]);

    // Từ điển từ đồng nghĩa để cải thiện matching
    this.synonymMap = new Map([
      ['đau', ['nhức', 'buốt', 'tức', 'cắn', 'thắt']],
      ['khó thở', ['hụt hơi', 'ngạt thở', 'thở gấp', 'nghẹt thở']],
      ['mệt mỏi', ['mệt lử', 'kiệt sức', 'uể oải', 'không có sức']],
      ['nôn', ['ói', 'mửa', 'nôn mửa']],
      ['tiêu chảy', ['đi lỏng', 'ỉa chảy', 'rối loạn tiêu hóa']],
      ['sốt', ['nóng sốt', 'sốt cao', 'bị sốt']],
      ['đau đầu', ['nhức đầu', 'au đầu', 'đau nửa đầu']],
      ['chóng mặt', ['hoa mắt', 'choáng váng', 'lú lẫn']]
    ]);

    // Cơ sở dữ liệu triệu chứng theo cơ quan/hệ thống (mở rộng)
    this.systemSymptoms = new Map([
      ['tim_mạch', ['đau ngực', 'khó thở', 'đánh trống ngực', 'phù chân', 'mệt mỏi', 'tim đập nhanh', 'hụt hơi']],
      ['hô_hấp', ['ho', 'khó thở', 'đờm', 'viêm họng', 'nghẹt mũi', 'thở gấp', 'ngạt thở', 'viêm phổi']],
      ['tiêu_hóa', ['đau bụng', 'nôn', 'tiêu chảy', 'táo bón', 'đầy hơi', 'ợ chua', 'khó tiêu']],
      ['thần_kinh', ['đau đầu', 'chóng mặt', 'tê bì', 'co giật', 'mất trí nhớ', 'yếu liệt', 'run tay']],
      ['cơ_xương_khớp', ['đau lưng', 'đau khớp', 'cứng khớp', 'yếu cơ', 'đau cột sống', 'thoát vị đĩa đệm']],
      ['da_liễu', ['ngứa', 'nổi mẩn', 'viêm da', 'mụn', 'nấm da', 'chàm', 'eczema', 'rụng tóc']],
      ['mắt', ['mờ mắt', 'đau mắt', 'khô mắt', 'đỏ mắt', 'nhìn đôi', 'tăng nhãn áp', 'võng mạc']],
      ['tai_mũi_họng', ['đau họng', 'ù tai', 'nghẹt mũi', 'chảy máu cam', 'nghe kém', 'chóng mặt tai', 'viêm tai']],
      ['tiết_niệu', ['đau tiểu', 'tiểu gấp', 'tiểu máu', 'tiểu buốt', 'sỏi thận', 'viêm bàng quang']],
      ['sinh_dục', ['đau bụng kinh', 'khí hư', 'rối loạn kinh nguyệt', 'viêm âm đạo']],
      
      // Hệ thống cơ thể mới
      ['chân_bàn_chân', ['đau chân', 'sưng chân', 'tê chân', 'phù chân', 'loét chân', 'gãy chân', 'viêm gân chân']],
      ['tay_cánh_tay', ['đau tay', 'tê tay', 'yếu tay', 'gãy tay', 'viêm gân tay', 'hội chứng ống cổ tay', 'run tay']],
      ['cổ_vai_gáy', ['đau cổ', 'cứng cổ', 'đau vai', 'đau gáy', 'tê tay từ cổ', 'u cổ', 'sưng cổ']],
      ['ngực_lồng_ngực', ['đau ngực', 'tức ngực', 'bóp nghẹt ngực', 'thở đau', 'đau sườn', 'gãy sườn']],
      ['bụng_ổ_bụng', ['đau bụng', 'nôn', 'tiêu chảy', 'táo bón', 'đầy hơi', 'đau ruột thừa', 'đau gan']],
      ['lưng_cột_sống', ['đau lưng', 'đau cột sống', 'đau lan xuống chân', 'cứng lưng', 'thoát vị đĩa đệm', 'đau toạ']],
      ['da_tóc_móng', ['ngứa', 'nổi mẩn', 'mụn', 'nấm da', 'rụng tóc', 'nấm móng', 'bỏng', 'cắt']]
    ]);

    // Load enhanced medical library
    this.enhancedLibrary = this.loadEnhancedMedicalLibrary();
  }

  // Load dữ liệu y khoa mở rộng
  loadEnhancedMedicalLibrary() {
    try {
      const fs = require('fs');
      const path = require('path');
      const libraryPath = path.join(__dirname, '../data/enhanced_medical_library.json');
      
      if (fs.existsSync(libraryPath)) {
        const data = fs.readFileSync(libraryPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load enhanced medical library, using fallback');
    }
    return [];
  }

  // Chuẩn hóa văn bản tiếng Việt cải tiến
  normalizeVietnamese(text) {
    if (!text) return '';
    
    let normalized = text.toLowerCase()
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // TẮT synonym expansion để tránh false positive
    // for (const [key, synonyms] of this.synonymMap) {
    //   for (const synonym of synonyms) {
    //     if (normalized.includes(synonym)) {
    //       normalized += ' ' + key;
    //     }
    //   }
    // }

    return normalized;
  }

  // Phân tích triệu chứng thông minh hơn
  analyzeSymptoms(symptoms) {
    const normalizedSymptoms = this.normalizeVietnamese(symptoms);
    const words = normalizedSymptoms.split(' ').filter(w => w.length > 2);
    
    const analysis = {
      matchedSymptoms: [],
      possibleSpecialties: new Map(),
      urgencyLevel: 'cần theo dõi',
      confidence: 0,
      systemAffected: [],
      riskFactors: []
    };

    // 1. Exact matching với triệu chứng - CHỈ match chính xác 100%
    for (const [symptom, specialties] of this.symptomSpecialtyMap) {
      const normalizedSymptom = this.normalizeVietnamese(symptom);
      
      // CHỈ match nếu input và symptom CHÍNH XÁC giống nhau
      if (normalizedSymptoms === normalizedSymptom) {
        analysis.matchedSymptoms.push(symptom);
        specialties.forEach(specialty => {
          const current = analysis.possibleSpecialties.get(specialty) || 0;
          analysis.possibleSpecialties.set(specialty, current + 1.0);
        });
      }
    }

    // 2. DISABLED fuzzy matching để tránh false positive
    // Chỉ dùng exact matching và word-level matching với threshold cao
    if (analysis.matchedSymptoms.length === 0) {
      // Simple word matching với threshold rất nghiêm ngặt
      for (const [symptom, specialties] of this.symptomSpecialtyMap) {
        const symptomWords = this.normalizeVietnamese(symptom).split(' ');
        const matchCount = symptomWords.filter(w => words.includes(w) && w.length > 2).length;
        
        if (matchCount > 0) {
          const confidence = matchCount / symptomWords.length;
          // CHỈ match nếu confidence >= 0.8 HOẶC match toàn bộ từ
          if (confidence >= 0.8 || (confidence >= 0.6 && matchCount >= symptomWords.length)) {
            analysis.matchedSymptoms.push(symptom);
            specialties.forEach(specialty => {
              const current = analysis.possibleSpecialties.get(specialty) || 0;
              analysis.possibleSpecialties.set(specialty, current + confidence);
            });
          }
        }
      }
    }

    // 3. Xác định hệ thống cơ thể bị ảnh hưởng - CHỈ dựa trên matched symptoms
    for (const [system, systemSymptoms] of this.systemSymptoms) {
      const matches = systemSymptoms.filter(s => 
        analysis.matchedSymptoms.includes(s)  // CHỈ check trong matched symptoms
      );
      if (matches.length > 0) {
        analysis.systemAffected.push(system);
      }
    }

    // 4. Đánh giá mức độ khẩn cấp
    analysis.urgencyLevel = this.assessUrgencyAdvanced(normalizedSymptoms);

    // 5. Tính confidence score
    analysis.confidence = this.calculateAdvancedConfidence(
      analysis.matchedSymptoms, 
      words, 
      analysis.systemAffected
    );

    // 6. Sắp xếp specialties theo điểm số
    const sortedSpecialties = Array.from(analysis.possibleSpecialties.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([specialty]) => specialty);

    return {
      ...analysis,
      specialties: sortedSpecialties.slice(0, 5)
    };
  }

  // Đánh giá khẩn cấp nâng cao với scoring system
  assessUrgencyAdvanced(normalizedSymptoms) {
    let urgencyScore = 0;
    let matchedCritical = [];

    // 1. Kiểm tra từ khóa khẩn cấp với scoring
    for (const [level, keywords] of this.urgencyKeywords) {
      for (const keyword of keywords) {
        if (normalizedSymptoms.includes(this.normalizeVietnamese(keyword))) {
          if (level === 'khẩn cấp') {
            urgencyScore += 10;
            matchedCritical.push(keyword);
          } else if (level === 'cần khám sớm') {
            urgencyScore += 5;
          } else {
            urgencyScore += 1;
          }
        }
      }
    }

    // 2. Critical combination patterns
    const criticalCombinations = [
      // Tim mạch cấp cứu
      { symptoms: ['đau ngực', 'khó thở'], score: 15, type: 'cardiac' },
      { symptoms: ['đau ngực', 'lan ra tay'], score: 12, type: 'cardiac' },
      { symptoms: ['đau ngực', 'mồ hôi lạnh'], score: 10, type: 'cardiac' },
      { symptoms: ['tim đập nhanh', 'đau ngực'], score: 8, type: 'cardiac' },
      
      // Thần kinh cấp cứu
      { symptoms: ['sốt cao', 'cứng gáy'], score: 15, type: 'neurological' },
      { symptoms: ['đau đầu', 'cứng gáy'], score: 12, type: 'neurological' },
      { symptoms: ['yếu liệt', 'nói khó'], score: 15, type: 'stroke' },
      { symptoms: ['tê bì', 'yếu chân'], score: 10, type: 'neurological' },
      
      // Hô hấp cấp cứu
      { symptoms: ['khó thở', 'ho ra máu'], score: 15, type: 'respiratory' },
      { symptoms: ['ngạt thở', 'da tím tái'], score: 15, type: 'respiratory' },
      { symptoms: ['thở gấp', 'đau ngực'], score: 10, type: 'respiratory' },
      
      // Tiêu hóa cấp cứu
      { symptoms: ['đau bụng', 'nôn ra máu'], score: 15, type: 'gi_bleeding' },
      { symptoms: ['đau bụng dữ dội', 'sốt'], score: 12, type: 'abdomen' },
      { symptoms: ['bụng cứng', 'đau'], score: 10, type: 'peritonitis' },
      
      // Mắt cấp cứu
      { symptoms: ['mờ mắt', 'đột ngột'], score: 12, type: 'vision' },
      { symptoms: ['đau mắt', 'buồn nôn'], score: 10, type: 'glaucoma' },
      { symptoms: ['nhìn thấy', 'ánh sáng chớp'], score: 12, type: 'retinal' },
      
      // Chấn thương
      { symptoms: ['gãy', 'biến dạng'], score: 12, type: 'fracture' },
      { symptoms: ['chảy máu', 'không cầm'], score: 15, type: 'bleeding' },
      { symptoms: ['bỏng', 'diện tích lớn'], score: 12, type: 'burn' },
      
      // Nhiễm trùng nghiêm trọng
      { symptoms: ['sốt cao', 'ớn lạnh'], score: 8, type: 'sepsis' },
      { symptoms: ['nhiễm trùng', 'lan rộng'], score: 10, type: 'infection' }
    ];

    // Check combinations
    for (const combo of criticalCombinations) {
      const matches = combo.symptoms.filter(symptom => 
        normalizedSymptoms.includes(this.normalizeVietnamese(symptom))
      );
      
      if (matches.length >= 2) {
        urgencyScore += combo.score;
      } else if (matches.length === 1 && combo.score >= 12) {
        urgencyScore += Math.floor(combo.score / 2);
      }
    }

    // 3. High-risk single symptoms
    const criticalSingleSymptoms = [
      'ngất xíu', 'bất tỉnh', 'co giật', 'liệt', 'điếc đột ngột',
      'mất thị lực', 'xuất huyết', 'sốc', 'ngạt thở', 'đột quỵ'
    ];

    for (const symptom of criticalSingleSymptoms) {
      if (normalizedSymptoms.includes(this.normalizeVietnamese(symptom))) {
        urgencyScore += 15;
      }
    }

    // 4. Age and risk modifiers
    const ageRiskKeywords = ['trẻ em', 'người già', 'cao tuổi', 'tiểu đường', 'tim mạch'];
    for (const risk of ageRiskKeywords) {
      if (normalizedSymptoms.includes(this.normalizeVietnamese(risk))) {
        urgencyScore += 2;
      }
    }

    // 5. Check for routine/chronic indicators
    let routineIndicatorCount = 0;
    for (const indicator of this.routineIndicators) {
      if (normalizedSymptoms.includes(this.normalizeVietnamese(indicator))) {
        routineIndicatorCount++;
        urgencyScore -= 2; // Reduce score for routine indicators
      }
    }

    // 6. Workplace/lifestyle related symptoms (lower urgency)
    const workplaceSymptoms = [
      'làm việc máy tính', 'văn phòng', 'ngồi lâu', 'stress công việc',
      'do công việc', 'khi làm việc', 'cuối ngày làm việc', 'mỏi mắt màn hình'
    ];
    
    let workplaceCount = 0;
    for (const symptom of workplaceSymptoms) {
      if (normalizedSymptoms.includes(this.normalizeVietnamese(symptom))) {
        workplaceCount++;
        urgencyScore -= 1;
      }
    }

    // 7. Adjust final scoring with better thresholds
    if (urgencyScore >= 15) {
      return 'khẩn cấp';
    } else if (urgencyScore >= 7) {
      return 'cần khám sớm';
    } else if (urgencyScore >= 2 || routineIndicatorCount >= 2 || workplaceCount >= 1) {
      return 'cần theo dõi';
    } else {
      // Final pattern matching for common scenarios
      
      // Chronic/routine patterns
      const chronicPatterns = [
        'mãn tính', 'thường xuyên nhưng nhẹ', 'ổn định', 'không thay đổi',
        'từ từ phát triển', 'đã lâu', 'nhiều năm', 'quen thuộc'
      ];
      
      for (const pattern of chronicPatterns) {
        if (normalizedSymptoms.includes(this.normalizeVietnamese(pattern))) {
          return 'cần theo dõi';
        }
      }
      
      // Mild descriptors
      const mildDescriptors = ['nhẹ', 'không nhiều', 'thỉnh thoảng', 'đôi khi'];
      for (const desc of mildDescriptors) {
        if (normalizedSymptoms.includes(this.normalizeVietnamese(desc))) {
          return 'cần theo dõi';
        }
      }
      
      // Default for unclear cases - better to be cautious
      return 'cần khám sớm';
    }
  }

  // Tính confidence score nâng cao
  calculateAdvancedConfidence(matchedSymptoms, inputWords, systemsAffected) {
    if (matchedSymptoms.length === 0) return 0.1;

    let score = 0;
    
    // Điểm từ triệu chứng khớp
    const symptomScore = Math.min(0.6, matchedSymptoms.length * 0.2);
    score += symptomScore;

    // Điểm từ độ dài mô tả
    const lengthScore = Math.min(0.2, inputWords.length * 0.02);
    score += lengthScore;

    // Điểm từ hệ thống cơ thể khớp
    const systemScore = Math.min(0.2, systemsAffected.length * 0.1);
    score += systemScore;

    return Math.min(0.95, Math.max(0.1, score));
  }

  // Phân tích theo độ tuổi nâng cao
  getAdvancedAgeRecommendations(age) {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return [];

    if (ageNum < 1) return this.ageSpecialtyMap.get('0-1') || [];
    if (ageNum <= 15) return this.ageSpecialtyMap.get('1-15') || [];
    if (ageNum <= 25) return this.ageSpecialtyMap.get('16-25') || [];
    if (ageNum <= 65) return this.ageSpecialtyMap.get('26-65') || [];
    if (ageNum <= 80) return this.ageSpecialtyMap.get('66-80') || [];
    return this.ageSpecialtyMap.get('80+') || [];
  }

  // Phân tích theo giới tính nâng cao
  getAdvancedGenderRecommendations(gender, age) {
    const normalizedGender = this.normalizeVietnamese(gender);
    const ageNum = parseInt(age) || 25;
    
    if (normalizedGender.includes('nu')) {
      const femaleMap = this.genderSpecialtyMap.get('nữ');
      if (ageNum >= 15 && ageNum <= 45) return femaleMap.reproductive_age;
      if (ageNum > 45) return femaleMap.menopause;
      return femaleMap.general;
    }
    
    if (normalizedGender.includes('nam')) {
      const maleMap = this.genderSpecialtyMap.get('nam');
      if (ageNum > 50) return maleMap.elderly;
      return maleMap.general;
    }
    
    return [];
  }

  // Phân tích toàn diện bệnh nhân
  async comprehensiveAnalysis(patientData) {
    const { primaryConcern, age, gender, symptomDuration, medicalHistory, location } = patientData;
    
    // Phân tích triệu chứng chính
    const symptomAnalysis = this.analyzeSymptoms(primaryConcern || '');
    
    // Phân tích theo tuổi
    const ageRecommendations = this.getAdvancedAgeRecommendations(age);
    
    // Phân tích theo giới tính
    const genderRecommendations = this.getAdvancedGenderRecommendations(gender, age);
    
    // Kết hợp tất cả khuyến nghị với trọng số
    const finalSpecialties = new Map();
    
    // Triệu chứng: trọng số cao nhất (1.0)
    symptomAnalysis.specialties.forEach((specialty, index) => {
      const weight = 1.0 - (index * 0.1); // Giảm dần theo thứ tự
      finalSpecialties.set(specialty, (finalSpecialties.get(specialty) || 0) + weight);
    });
    
    // Tuổi: trọng số trung bình (0.4)
    ageRecommendations.forEach(specialty => {
      finalSpecialties.set(specialty, (finalSpecialties.get(specialty) || 0) + 0.4);
    });
    
    // Giới tính: trọng số thấp (0.3)
    genderRecommendations.forEach(specialty => {
      finalSpecialties.set(specialty, (finalSpecialties.get(specialty) || 0) + 0.3);
    });
    
    // Sắp xếp theo điểm số
    const rankedSpecialties = Array.from(finalSpecialties.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([specialty, score]) => ({ specialty, score: score.toFixed(2) }));

    // Filter để chỉ lấy 1-2 most relevant specialties
    const focusedSpecialties = this.filterTopRelevantSpecialties(
      Array.from(finalSpecialties.entries()).sort((a, b) => b[1] - a[1]),
      { urgencyLevel: symptomAnalysis.urgencyLevel }
    );

    const baseAnalysis = {
      recommendedSpecialties: focusedSpecialties,
      specialtyScores: rankedSpecialties.slice(0, 3),
      urgencyLevel: symptomAnalysis.urgencyLevel,
      confidence: symptomAnalysis.confidence,
      matchedSymptoms: symptomAnalysis.matchedSymptoms,
      systemsAffected: symptomAnalysis.systemAffected,
      medicalContext: {
        patientProfile: { age, gender, location },
        riskLevel: this.assessRiskLevel(symptomAnalysis.urgencyLevel, age),
        recommendedActions: this.getRecommendedActions(symptomAnalysis.urgencyLevel),
        followUpInstructions: this.getFollowUpInstructions(symptomAnalysis.urgencyLevel)
      }
    };

    // Apply cross-mapping enhancement
    const contextFactors = {
      age,
      gender,
      location,
      primaryConcern,
      duration: symptomDuration,
      medicalHistory,
      additionalSymptoms: symptomAnalysis.matchedSymptoms,
      description: primaryConcern
    };

    const enhancedAnalysis = crossMappingService.enhanceWithCrossMapping(baseAnalysis, contextFactors);

    // Add location-based recommendations if user requests
    enhancedAnalysis.locationBasedRecommendations = await this.getLocationBasedRecommendations(
      primaryConcern,
      enhancedAnalysis.recommendedSpecialties,
      { age, gender, location, primaryConcern }
    );

    return enhancedAnalysis;
  }

  // Get location-based hospital recommendations
  async getLocationBasedRecommendations(userInput, recommendedSpecialties, patientData) {
    try {
      // Check if user wants location-based recommendations
      const needsLocationRecommendation = this.checkLocationPreference(userInput);
      
      if (!needsLocationRecommendation) {
        return null;
      }

      const locationRecommendations = await locationBasedRecommendation.processLocationBasedRequest(
        userInput,
        recommendedSpecialties.slice(0, 3), // Top 3 specialties
        patientData
      );

      return locationRecommendations;
    } catch (error) {
      console.error('❌ Location-based recommendation failed:', error.message);
      return null;
    }
  }

  // Check if user wants location-based recommendations
  checkLocationPreference(userInput) {
    if (!userInput) return false;

    const locationKeywords = [
      'gần nhà', 'gần chỗ tôi', 'gần đây', 'địa phương', 'trong khu vực',
      'khám gần', 'bệnh viện gần', 'phòng khám gần', 'tại', 'ở'
    ];

    const normalizedInput = userInput.toLowerCase();
    return locationKeywords.some(keyword => normalizedInput.includes(keyword));
  }

  // Đánh giá mức độ rủi ro
  assessRiskLevel(urgencyLevel, age) {
    const ageNum = parseInt(age) || 25;
    let riskMultiplier = 1;
    
    if (ageNum < 5 || ageNum > 65) riskMultiplier = 1.5;
    if (ageNum > 80) riskMultiplier = 2;
    
    switch (urgencyLevel) {
      case 'khẩn cấp': return Math.min(10, 9 * riskMultiplier);
      case 'cần khám sớm': return Math.min(10, 6 * riskMultiplier);
      case 'cần theo dõi': return Math.min(10, 3 * riskMultiplier);
      default: return 2;
    }
  }

  // Hướng dẫn hành động
  getRecommendedActions(urgencyLevel) {
    switch (urgencyLevel) {
      case 'khẩn cấp':
        return [
          'Đến cơ sở y tế gần nhất ngay lập tức',
          'Gọi 115 nếu có triệu chứng nguy hiểm',
          'Không tự điều trị tại nhà',
          'Chuẩn bị thông tin bệnh sử và thuốc đang dùng'
        ];
      case 'cần khám sớm':
        return [
          'Đặt lịch khám trong 24-48 giờ tới',
          'Theo dõi sát diễn biến triệu chứng',
          'Chuẩn bị danh sách thuốc và tiền sử bệnh',
          'Đến cấp cứu nếu triệu chứng nặng lên'
        ];
      default:
        return [
          'Theo dõi triệu chứng trong vài ngày',
          'Nghỉ ngơi đầy đủ và uống nhiều nước',
          'Đặt lịch khám nếu không cải thiện',
          'Ghi chép diễn biến để báo cáo bác sĩ'
        ];
    }
  }

  // Hướng dẫn theo dõi
  getFollowUpInstructions(urgencyLevel) {
    switch (urgencyLevel) {
      case 'khẩn cấp':
        return 'Cần can thiệp y tế ngay lập tức - không chờ đợi';
      case 'cần khám sớm':
        return 'Theo dõi trong 12-24 giờ, đi khám nếu không cải thiện';
      default:
        return 'Theo dõi 3-5 ngày, đi khám nếu triệu chứng kéo dài hoặc nặng lên';
    }
  }

  // Lọc để chỉ lấy 1-2 chuyên khoa most relevant
  filterTopRelevantSpecialties(sortedSpecialties, enhancedAnalysis) {
    if (sortedSpecialties.length === 0) return [];
    
    const topSpecialty = sortedSpecialties[0];
    const topScore = topSpecialty[1];
    
    // Nếu chỉ có 1 specialty có score cao rõ ràng
    if (sortedSpecialties.length === 1 || topScore >= 2.0) {
      return [topSpecialty[0]];
    }
    
    const secondSpecialty = sortedSpecialties[1];
    const secondScore = secondSpecialty[1];
    
    // Kiểm tra urgency level để quyết định số specialty
    const urgencyLevel = enhancedAnalysis?.urgencyLevel;
    
    // Emergency cases: Focus vào 1 specialty chính
    if (urgencyLevel === 'khẩn cấp') {
      // Chỉ lấy top 1 specialty cho emergency
      return [topSpecialty[0]];
    }
    
    // Non-emergency: Có thể lấy 2 nếu scores gần bằng nhau
    const scoreDifference = topScore - secondScore;
    
    // Nếu score khác nhau quá nhiều (>1.0), chỉ lấy top 1
    if (scoreDifference > 1.0) {
      return [topSpecialty[0]];
    }
    
    // Nếu scores gần bằng nhau, lấy 2 specialties
    if (scoreDifference <= 0.5 && secondScore >= 1.0) {
      return [topSpecialty[0], secondSpecialty[0]];
    }
    
    // Default: chỉ lấy top 1
    return [topSpecialty[0]];
  }
}

module.exports = new EnhancedMedicalKnowledgeService();