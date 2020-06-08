# -*- coding: cp936 -*-
import string
from docx import Document
from docx.shared import Pt, Inches, Cm
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_PARAGRAPH_ALIGNMENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL

import arcpy
from ExportJPG import ExportToJPGFile

# 判断样式是否存在
def styleExists(document, style_name):
    stylename_list = [st.name for st in document.styles]
    if style_name in stylename_list:
        return True
    else:
        return False

# 添加样式到文档
def addStyleToDocument(document, style_name):
    if not styleExists(document,style_name):
        title_style = document.styles.add_style(style_name, WD_ALIGN_PARAGRAPH)
        title_style.font.size = Pt(16)
        title_style.font.bold=True

# 创建一个表格
def CreateTable(document,row, rsPicPath=None):
    rows,cols = 12,25
    table = document.add_table(rows=rows,cols=cols,style = 'Table Grid')
    table.alignment = WD_TABLE_ALIGNMENT.CENTER  # 表格整体居中
    table.style.font.size=Pt(11) # 字号
    for i in range(rows):
        table.rows[i].height = Cm(0.6)

    
    # 室内编号
    table.cell(0,0).merge(table.cell(0,2)).text=(u"解译编号")
    table.cell(0,3).merge(table.cell(0,6)).text=(row.getValue(u"解译编号"))

    # 项目名称
    table.cell(0,7).merge(table.cell(0,11)).text=(u"子项目名称")
    table.cell(0,12).merge(table.cell(0,24)).text=(u'泄滩幅1:5万水文地质环境地质综合遥感解译')

    # 解译内容
    table.cell(1,0).merge(table.cell(2,2)).text=(u"解译内容")
    table.cell(1,3).merge(table.cell(2,8)).text=(u"断层")
    table.cell(1,0).vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    #坐标
    table.cell(1,9).merge(table.cell(2,10)).text=(u"坐标")
    table.cell(1,9).vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    # Y
    table.cell(2,11).merge(table.cell(2,12)).text=(u"Y")
    table.cell(2,13).merge(table.cell(2,16)).text=("{0:.2f}".format(row.getValue(u"Y坐标")))

    # X
    table.cell(1,11).merge(table.cell(1,12)).text=(u"X")
    table.cell(1,13).merge(table.cell(1,16)).text=("{0:.2f}".format(row.getValue(u"X坐标")))

    # N
    table.cell(1,17).merge(table.cell(1,18)).text=(u"N")
    table.cell(1,19).merge(table.cell(1,24)).text=(row.getValue(u"纬度"))

    # E
    table.cell(2,17).merge(table.cell(2,18)).text=(u"E")
    table.cell(2,19).merge(table.cell(2,24)).text=(row.getValue(u"经度"))

    # 地理位置
    table.cell(3,0).merge(table.cell(3,2)).text=(u'地理位置')
    table.cell(3,3).merge(table.cell(3,24)).text=(row.getValue(u'Problem'))
     
    # 影像概貌
    table.cell(4,0).merge(table.cell(4,2)).text=(u'影像概貌')
    table.cell(4,3).merge(table.cell(4,24)).text=(row.getValue(u'Problem'))

    # 遥感影像
    table.cell(5,0).merge(table.cell(5,2)).text=(u"遥感影像")
    table.cell(5,0).vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    c_polygonImage = table.cell(5,3).merge(table.cell(5,24))
    pic_p = c_polygonImage.paragraphs[0]
    pic_r = pic_p.add_run()
    pic_r.add_picture(rsPicPath,width=Inches(3))
    pic_p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER

    # 野外验证
    table.cell(6,0).merge(table.cell(6,2)).text=(u"野外验证")
    table.cell(6,0).vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    table.cell(6,3).merge(table.cell(6,13))
    table.cell(6,14).merge(table.cell(6,24))
    table.rows[6].height=Inches(3)

    # 综合解译
    table.cell(7,0).merge(table.cell(9,2)).text=(u'综合解译')
    table.cell(7,0).vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    table.cell(7,3).merge(table.cell(9,24)).text=(row.getValue(u'特征'))

    # 项目信息
    table.cell(10,0).merge(table.cell(10,2)).text=(u"项目名称")
    table.cell(10,3).merge(table.cell(10,15)).text=(u'宜昌市资源环境承载能力评价')
    table.cell(10,16).merge(table.cell(10,18)).text=(u"承担单位")
    table.cell(10,19).merge(table.cell(10,24)).text=(u'')

    # 人员信息
    table.cell(11,0).merge(table.cell(11,2)).text=(u"解译人员")
    table.cell(11,3).merge(table.cell(11,8)).text=(u'')
    table.cell(11,9).merge(table.cell(11,12)).text=(u"解译时间")
    table.cell(11,13).merge(table.cell(11,18)).text=('')
    table.cell(11,19).merge(table.cell(11,21)).text=(u'审核')
    table.cell(11,22).merge(table.cell(11,24)).text=('')

#----------ArcTooolbox模式----------
# docx_template_file = arcpy.GetParameterAsText(0)
# table_title = arcpy.GetParameterAsText(1)
# images_output_dir = arcpy.GetParameterAsText(2)
# para_fc_count = arcpy.GetParameterAsText(3)
# mxd = arcpy.mapping.MapDocument("CURRENT")

# # #----------代码运行模式----------
docx_template_file = "XietanFaultResult.docx"
table_title = u""
images_output_dir = r"."
# # mxd文件切记，不能用中文名，否则会报IO错
mxd = arcpy.mapping.MapDocument(r"XietanFaultForExport.mxd")

lyr = arcpy.mapping.ListLayers(mxd)[0]
df = arcpy.mapping.ListDataFrames(mxd)[0]

fields = arcpy.ListFields(lyr.dataSource)
fieldnames = [f.name for f in fields]

document = Document(docx_template_file)
cursor = arcpy.SearchCursor(lyr,fieldnames)

# 若para_fc_count为0，则输出所有要素
# 若para_fc_count不为0，则输出para_fc_count个要素
# fc_count为最终输出到docx文件的要素数目
para_fc_count=0
fc_count=0
if int(para_fc_count)==0:
    fc_count = int(arcpy.GetCount_management(lyr.dataSource).getOutput(0))
else:
    fc_count = int(para_fc_count)

# 设置进度条
arcpy.SetProgressor("step", u"正在生成解译卡片...", 0, fc_count, 1)

ii=0
for row in cursor:
    if ii<fc_count:
        document.add_paragraph(table_title, "MyStyle")
        filename = row.getValue(u"解译编号")
        picPath= ExportToJPGFile(mxd,df,lyr,ii,images_output_dir,filename)
        CreateTable(document, row, picPath)
        arcpy.AddMessage(u"完成第 {0} 个 卡片...".format(ii+1))
        document.add_page_break()
        # 更新进度条位置
        arcpy.SetProgressorPosition()
    else:
        break
    ii = ii + 1
document.save(docx_template_file)

