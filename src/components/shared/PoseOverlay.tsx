import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface JointPosition {
  x: number;
  y: number;
  isCorrect: boolean;
  name: string;
}

interface PoseOverlayProps {
  joints: JointPosition[];
  overallCorrect: boolean;
  feedback?: string;
  className?: string;
}

// Static mock joints for demonstration
export const mockJoints: JointPosition[] = [
  { x: 50, y: 15, isCorrect: true, name: 'head' },
  { x: 50, y: 25, isCorrect: true, name: 'neck' },
  { x: 35, y: 30, isCorrect: true, name: 'left_shoulder' },
  { x: 65, y: 30, isCorrect: false, name: 'right_shoulder' },
  { x: 25, y: 45, isCorrect: true, name: 'left_elbow' },
  { x: 75, y: 42, isCorrect: false, name: 'right_elbow' },
  { x: 20, y: 55, isCorrect: true, name: 'left_wrist' },
  { x: 80, y: 50, isCorrect: false, name: 'right_wrist' },
  { x: 50, y: 45, isCorrect: true, name: 'torso' },
  { x: 40, y: 55, isCorrect: true, name: 'left_hip' },
  { x: 60, y: 55, isCorrect: true, name: 'right_hip' },
  { x: 38, y: 70, isCorrect: true, name: 'left_knee' },
  { x: 62, y: 70, isCorrect: true, name: 'right_knee' },
  { x: 36, y: 88, isCorrect: true, name: 'left_ankle' },
  { x: 64, y: 88, isCorrect: true, name: 'right_ankle' },
];

// Connections between joints
const connections = [
  ['head', 'neck'],
  ['neck', 'left_shoulder'],
  ['neck', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_elbow', 'right_wrist'],
  ['neck', 'torso'],
  ['torso', 'left_hip'],
  ['torso', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee'],
  ['left_knee', 'left_ankle'],
  ['right_knee', 'right_ankle'],
];

export function PoseOverlay({ joints, overallCorrect, feedback, className }: PoseOverlayProps) {
  const { t } = useTranslation();
  
  const getJoint = (name: string) => joints.find(j => j.name === name);

  return (
    <div className={cn('relative w-full h-full', className)}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Draw connections */}
        {connections.map(([from, to]) => {
          const fromJoint = getJoint(from);
          const toJoint = getJoint(to);
          if (!fromJoint || !toJoint) return null;
          
          const isCorrect = fromJoint.isCorrect && toJoint.isCorrect;
          
          return (
            <line
              key={`${from}-${to}`}
              x1={fromJoint.x}
              y1={fromJoint.y}
              x2={toJoint.x}
              y2={toJoint.y}
              stroke={isCorrect ? 'hsl(142, 70%, 45%)' : 'hsl(0, 84%, 60%)'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
        
        {/* Draw joints */}
        {joints.map((joint) => (
          <g key={joint.name}>
            <circle
              cx={joint.x}
              cy={joint.y}
              r="3"
              fill={joint.isCorrect ? 'hsl(142, 70%, 45%)' : 'hsl(0, 84%, 60%)'}
              stroke="white"
              strokeWidth="1"
            />
            {!joint.isCorrect && (
              <circle
                cx={joint.x}
                cy={joint.y}
                r="5"
                fill="none"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth="1"
                opacity="0.5"
                className="animate-ping"
              />
            )}
          </g>
        ))}
      </svg>
      
      {/* Feedback text */}
      <div className={cn(
        'absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md',
        overallCorrect 
          ? 'bg-success/90 text-success-foreground' 
          : 'bg-destructive/90 text-destructive-foreground'
      )}>
        {feedback || (overallCorrect ? t('workout.goodForm') : t('workout.adjustPosition'))}
      </div>
    </div>
  );
}
