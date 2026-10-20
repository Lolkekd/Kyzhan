import { CodeXml, Layers, Zap, type LucideIcon } from 'lucide-react';

/** КОМАНДЫ: название, девиз, цвет и иконку можно менять здесь */
export interface Team {
  id: 'team1' | 'team2' | 'team3';
  number: number;
  name: string;
  motto: string;
  color: string;
  icon: LucideIcon;
  members: number;
}

export const teams: Team[] = [
  {
    id: 'team1',
    number: 1,
    name: 'Тег шеберлері',
    motto: 'Әр тег — өз орнында!',
    color: '#0891a2',
    icon: CodeXml,
    members: 8,
  },
  {
    id: 'team2',
    number: 2,
    name: 'Веб-сәулетшілер',
    motto: 'Құрылымды біз саламыз!',
    color: '#8b4fe8',
    icon: Layers,
    members: 8,
  },
  {
    id: 'team3',
    number: 3,
    name: 'Пиксель батырлары',
    motto: 'Әр пиксель маңызды!',
    color: '#e69500',
    icon: Zap,
    members: 8,
  },
];
