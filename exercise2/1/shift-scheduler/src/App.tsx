import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Checkbox, InputNumber, Form } from 'antd';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import './App.css';

interface Volunteer {
  id: string;
  name: string;
  schedule: number[][];
  totalShifts: number;
}

export default function ScheduleSystem() {
  const [form] = Form.useForm();
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => {
    try {
      const saved = localStorage.getItem('volunteers');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('加载志愿者数据失败:', error);
      return [];
    }
  });

  const [requirements, setRequirements] = useState([2, 3, 2, 2, 3, 1]);
  const [schedule, setSchedule] = useState(
    Array(5).fill(null).map(() => 
      Array(6).fill(null).map(() => []))
  );

  useEffect(() => {
    localStorage.setItem('volunteers', JSON.stringify(volunteers));
  }, [volunteers]);

  const generateSchedule = () => {
    const newSchedule: string[][][] = Array(5).fill(null).map(() => 
      Array(6).fill(null).map(() => []));

    // 创建志愿者副本并跟踪值班次数
    const volunteersWithShifts = volunteers.map(volunteer => ({
      ...volunteer,
      totalShifts: 0
    }));

    // 遍历每个时间段进行排班
    for (let day = 0; day < 5; day++) {
      for (let period = 0; period < 6; period++) {
        // 获取当前时间段需要的志愿者数量
        const required = requirements[period];
        
        // 筛选可用志愿者并按值班次数排序（最少优先）
        const availableVolunteers = volunteersWithShifts
          .filter(v => v.schedule[day][period] === 0)
          .sort((a, b) => a.totalShifts - b.totalShifts);

        // 选择前N个志愿者
        const selected = availableVolunteers.slice(0, required);
        
        // 更新值班次数
        selected.forEach(v => v.totalShifts++);
        
        // 记录排班结果
        newSchedule[day][period] = selected.map(v => v.name);
      }
    }

    setSchedule(newSchedule);
  };

  const exportToExcel = () => {
    const data = schedule.flatMap((day, dayIdx) =>
      day.map((names, periodIdx) => ({
        '日期': `第${dayIdx + 1}天`,
        '时间段': `第${periodIdx + 1}节课`,
        '值班人员': names.join(', ') || '无',
        '需求状态': names.length >= requirements[periodIdx] ? '满足' : '不足'
      }))
    );

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '排班表');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), '排班表.xlsx');
  };

  const addVolunteer = (values: { name: string; schedule: number[][] }) => {
    setVolunteers(prev => [...prev, {
      id: crypto.randomUUID(),
      name: values.name.trim(),
      schedule: values.schedule
    }]);
    form.resetFields();
  };

  const updateRequirement = (index: number, value: number | null) => {
    if (value === null) return;
    setRequirements(prev => {
      const newReq = [...prev];
      newReq[index] = Math.max(1, Math.min(5, value));
      return newReq;
    });
  };

  return (
    <div className="App">
      <div className="section">
        <h2>志愿者管理</h2>
        <Form form={form} onFinish={addVolunteer} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item label="空闲时间" name="schedule" required>
            <Form.List name="schedule">
              {(fields) => (
                <>
                  {fields.map((dayField, dayIndex) => (
                    <div key={dayField.key} style={{ marginBottom: 16 }}>
                      <h4>第{dayIndex + 1}天</h4>
                      <Form.Item
                        {...dayField}
                        rules={[{ required: true, message: '请选择空闲时间' }]}
                      >
                        <Checkbox.Group options={(
                          Array(6).fill(null).map((_, period) => ({
                            label: `第${period + 1}节课`,
                            value: period.toString()
                          })) as { label: string; value: string }[]
                        )} />
                      </Form.Item>
                    </div>
                  ))}
                </>
              )}
            </Form.List>
          </Form.Item>

          <Button type="primary" htmlType="submit">添加志愿者</Button>
        </Form>
      </div>

      <div className="section">
        <h2>班次设置</h2>
        <div className="shift-settings">
          {requirements.map((req, index) => (
            <div key={index} className="shift-setting">
              <span>第{index + 1}节课：</span>
              <InputNumber 
                min={1} 
                max={5} 
                value={req}
                onChange={value => updateRequirement(index, value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>值班表</h2>
        <Button onClick={generateSchedule} style={{ marginBottom: 16 }}>生成排班表</Button>
        <Button onClick={exportToExcel} style={{ marginLeft: 16 }}>导出Excel</Button>
        
        <Table
          bordered
          pagination={false}
          dataSource={schedule.map((day, dayIndex) => ({
            key: dayIndex,
            day: dayIndex + 1,
            periods: day.map((period, periodIndex) => ({
              period: periodIndex + 1,
              volunteers: period,
              required: requirements[periodIndex]
            }))
          }))}
          columns={[
            { title: '天', dataIndex: 'day', key: 'day' },
            ...Array(6).fill(null).map((_, periodIndex) => ({
              title: `第${periodIndex + 1}节课`,
              key: periodIndex,
              render: (_: unknown, record: { periods: Array<{ volunteers: string[]; required: number }> }) => {
                const period = record.periods[periodIndex];
                const isInsufficient = period.volunteers.length < period.required;
                return (
                  <div style={{ color: isInsufficient ? 'red' : 'inherit' }}>
                    {period.volunteers.join(', ') || '无'}
                    {isInsufficient && ` (需要${period.required}人)`}
                  </div>
                );
              }
            }))
          ]}
        />
      </div>
    </div>
  );
}
