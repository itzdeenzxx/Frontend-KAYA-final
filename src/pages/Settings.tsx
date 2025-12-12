import { useState } from "react";
import { ArrowLeft, Bell, Moon, Smartphone, Monitor, ChevronRight, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function Settings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    mealReminders: false,
    progressUpdates: true,
    coachTips: true,
  });
  const [darkMode, setDarkMode] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState([
    { name: "Living Room TV", type: "tv", connected: true },
    { name: "iPhone 15 Pro", type: "phone", connected: true },
  ]);

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            to="/profile"
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 space-y-6">
        {/* Notifications */}
        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral-light flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold">Notifications</h2>
          </div>
          <div className="divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Workout Reminders</p>
                <p className="text-sm text-muted-foreground">Get reminded to exercise</p>
              </div>
              <Switch
                checked={notifications.workoutReminders}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, workoutReminders: checked })
                }
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Meal Reminders</p>
                <p className="text-sm text-muted-foreground">Track your nutrition</p>
              </div>
              <Switch
                checked={notifications.mealReminders}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, mealReminders: checked })
                }
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Progress Updates</p>
                <p className="text-sm text-muted-foreground">Weekly summaries</p>
              </div>
              <Switch
                checked={notifications.progressUpdates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, progressUpdates: checked })
                }
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Coach Tips</p>
                <p className="text-sm text-muted-foreground">AI-powered advice</p>
              </div>
              <Switch
                checked={notifications.coachTips}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, coachTips: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-calm/10 flex items-center justify-center">
              <Moon className="w-5 h-5 text-calm" />
            </div>
            <h2 className="font-semibold">Appearance</h2>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Toggle dark theme</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </div>

        {/* Connected Devices */}
        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-nature/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-nature" />
            </div>
            <h2 className="font-semibold">Connected Devices</h2>
          </div>
          <div className="divide-y divide-border">
            {connectedDevices.map((device, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {device.type === "tv" ? (
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-nature">Connected</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
            <button className="w-full p-4 text-primary font-medium text-left">
              + Add New Device
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="card-elevated p-4 w-full flex items-center gap-3 text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}