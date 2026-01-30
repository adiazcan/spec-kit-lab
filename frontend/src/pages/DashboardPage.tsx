import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdventures, useDeleteAdventure } from "../hooks/useAdventures";
import AdventureList from "../components/AdventureList";
import CreateAdventureForm from "../components/CreateAdventureForm";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Adventure } from "../services/api";

/**
 * DashboardPage - Main page displaying adventure list
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: adventures = [], isLoading, error } = useAdventures();
  const deleteMutation = useDeleteAdventure();

  // Memoize callbacks to prevent unnecessary re-renders of child components
  const handleSelectAdventure = useCallback(
    (adventure: Adventure) => {
      // Navigate to game page
      navigate(`/game/${adventure.id}`);
    },
    [navigate],
  );

  const handleDeleteAdventure = useCallback(
    (id: string) => {
      const adventure = adventures.find((a) => a.id === id);
      if (adventure && adventure.id) {
        setDeleteConfirm({
          id: adventure.id,
          name: adventure.name || `Adventure ${id.substring(0, 8)}`,
        });
      }
    },
    [adventures],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      // Error is logged in the mutation hook
      console.error("Delete failed:", error);
    }
  }, [deleteConfirm, deleteMutation]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Adventures</h1>
        <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
          Create Adventure
        </button>
      </div>

      <AdventureList
        adventures={adventures}
        isLoading={isLoading}
        error={error as Error}
        onSelectAdventure={handleSelectAdventure}
        onDeleteAdventure={handleDeleteAdventure}
      />

      <CreateAdventureForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Adventure"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
